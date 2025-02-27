import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SES } from '@aws-sdk/client-ses';

interface OTPRecord {
  email: string;
  code: string;
  expiresAt: number;
}

export class OTPModel {
  private readonly tableName: string;
  private readonly dynamoDB: DynamoDB;
  private readonly ses: SES;
  private readonly OTP_EXPIRY_MINUTES = 5;

  constructor() {
    this.tableName = process.env.OTP_TABLE || '';
    this.dynamoDB = new DynamoDB({});
    this.ses = new SES({});
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private fromDynamoDB(item: Record<string, any>): OTPRecord {
    return {
      email: item.email.S!,
      code: item.code.S!,
      expiresAt: Number(item.expiresAt.N!)
    };
  }

  private async sendOTPEmail(email: string, code: string): Promise<void> {
    const params = {
      Source: process.env.SES_FROM_EMAIL || 'no-reply@emotiox.com',
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Tu código de acceso EmotioX'
        },
        Body: {
          Text: {
            Data: `Tu código de acceso es: ${code}\nEste código expirará en ${this.OTP_EXPIRY_MINUTES} minutos.`
          }
        }
      }
    };

    await this.ses.sendEmail(params);
  }

  async createOTP(email: string): Promise<string> {
    const code = this.generateOTP();
    const expiresAt = Math.floor(Date.now() / 1000) + (this.OTP_EXPIRY_MINUTES * 60);

    await this.dynamoDB.putItem({
      TableName: this.tableName,
      Item: {
        email: { S: email },
        code: { S: code },
        expiresAt: { N: expiresAt.toString() }
      }
    });

    await this.sendOTPEmail(email, code);
    return code;
  }

  async validateOTP(email: string, code: string): Promise<boolean> {
    const result = await this.dynamoDB.getItem({
      TableName: this.tableName,
      Key: {
        email: { S: email }
      }
    });

    if (!result.Item) {
      return false;
    }

    const otpRecord = this.fromDynamoDB(result.Item);
    const now = Math.floor(Date.now() / 1000);

    // Verificar si el código es válido y no ha expirado
    if (otpRecord.code === code && otpRecord.expiresAt > now) {
      // Eliminar el código OTP después de usarlo
      await this.deleteOTP(email);
      return true;
    }

    return false;
  }

  private async deleteOTP(email: string): Promise<void> {
    await this.dynamoDB.deleteItem({
      TableName: this.tableName,
      Key: {
        email: { S: email }
      }
    });
  }
}

export const otpModel = new OTPModel(); 