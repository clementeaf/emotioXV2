import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SES } from '@aws-sdk/client-ses';
import * as crypto from 'crypto';

interface OTPRecord {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export class OTPModel {
  private readonly tableName: string;
  private readonly dynamoDB: DynamoDB;
  private readonly ses: SES;
  private readonly OTP_EXPIRY_MINUTES: number;
  private readonly MAX_ATTEMPTS: number;

  constructor() {
    this.tableName = process.env.OTP_TABLE || '';
    this.OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || '5');
    this.MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || '3');
    
    // No usar variables de entorno reservadas de AWS en Lambda
    const config = {
      region: 'us-east-1'
      // Las credenciales se obtienen automáticamente del rol de la función Lambda
    };
    
    this.dynamoDB = new DynamoDB(config);
    this.ses = new SES(config);
  }

  private generateOTP(): string {
    // Uso de crypto para generación segura de números aleatorios
    return crypto.randomInt(100000, 999999).toString();
  }

  private fromDynamoDB(item: Record<string, any>): OTPRecord {
    return {
      email: item.email.S!,
      code: item.code.S!,
      expiresAt: Number(item.expiresAt.N!),
      attempts: Number(item.attempts?.N || '0')
    };
  }

  private async sendOTPEmail(email: string, code: string): Promise<void> {
    try {
      const remitente = process.env.SES_FROM_EMAIL;
      if (!remitente) {
        throw new Error('SES_FROM_EMAIL no está configurado');
      }
      
      console.log('=====================================================');
      console.log(`CÓDIGO OTP solicitado por ${email}: ${code}`);
      console.log(`Este código expirará en ${this.OTP_EXPIRY_MINUTES} minutos`);
      console.log(`Enviando el código a: ${email}`);
      console.log('=====================================================');
      
      // Configuramos el envío de correo
      const params = {
        Source: remitente,
        Destination: {
          ToAddresses: [email]
        },
        Message: {
          Subject: {
            Data: `Tu código de acceso EmotioX`
          },
          Body: {
            Html: {
              Data: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Tu código de acceso a EmotioX</h2>
                  <p>Se ha solicitado un código de acceso para tu cuenta.</p>
                  <p>Usa el siguiente código para iniciar sesión:</p>
                  <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold;">
                    ${code}
                  </div>
                  <p>Este código expirará en ${this.OTP_EXPIRY_MINUTES} minutos.</p>
                  <p>Si no solicitaste este código, puedes ignorar este correo.</p>
                </div>
              `
            },
            Text: {
              Data: `Tu código de acceso es: ${code}\nEste código expirará en ${this.OTP_EXPIRY_MINUTES} minutos.`
            }
          }
        }
      };

      try {
        console.log(`Enviando email a ${email}`);
        await this.ses.sendEmail(params);
        console.log('OTP enviado exitosamente por email');
      } catch (error: any) {
        console.error('Error al enviar email OTP:', error);
        console.log('Sin embargo, el código OTP está disponible en los logs para pruebas');
      }
    } catch (error: any) {
      console.error('Error al procesar OTP:', error);
      // No propagamos el error para que la aplicación siga funcionando
    }
  }

  async createOTP(email: string): Promise<string> {
    const code = this.generateOTP();
    const expiresAt = Math.floor(Date.now() / 1000) + (this.OTP_EXPIRY_MINUTES * 60);

    try {
      await this.dynamoDB.putItem({
        TableName: this.tableName,
        Item: {
          email: { S: email },
          code: { S: code },
          expiresAt: { N: expiresAt.toString() },
          attempts: { N: '0' }
        }
      });
      
      await this.sendOTPEmail(email, code);
      return code;
    } catch (error: any) {
      console.error('Error al crear OTP:', error);
      throw new Error(`Error al generar código: ${error.message}`);
    }
  }

  async validateOTP(email: string, code: string): Promise<boolean> {
    try {
      const result = await this.dynamoDB.getItem({
        TableName: this.tableName,
        Key: { email: { S: email } }
      });

      if (!result.Item) {
        console.log(`No se encontró OTP para ${email}`);
        return false;
      }

      const otpRecord = this.fromDynamoDB(result.Item);
      const now = Math.floor(Date.now() / 1000);
      const attempts = otpRecord.attempts;
      
      // Incrementar contador de intentos
      await this.dynamoDB.updateItem({
        TableName: this.tableName,
        Key: { email: { S: email } },
        UpdateExpression: 'SET attempts = :attempts',
        ExpressionAttributeValues: {
          ':attempts': { N: (attempts + 1).toString() }
        }
      });

      // Verificar límite de intentos
      if (attempts >= this.MAX_ATTEMPTS) {
        console.log(`Máximo de intentos alcanzado para ${email}`);
        await this.deleteOTP(email);
        return false;
      }

      // Verificar si expiró
      if (otpRecord.expiresAt <= now) {
        console.log(`OTP expirado para ${email}`);
        return false;
      }

      // Verificar código
      if (otpRecord.code === code) {
        await this.deleteOTP(email);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error al validar OTP:', error);
      return false;
    }
  }

  private async deleteOTP(email: string): Promise<void> {
    try {
      await this.dynamoDB.deleteItem({
        TableName: this.tableName,
        Key: {
          email: { S: email }
        }
      });
    } catch (error: any) {
      console.error('Error al eliminar OTP:', error);
    }
  }
}

export const otpModel = new OTPModel(); 