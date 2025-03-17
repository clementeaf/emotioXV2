import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from 'uuid';

// Inicializar cliente de DynamoDB
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Nombre de la tabla en DynamoDB
const TABLE_NAME = "emotio-x-backend-v2-dev-research";

export async function GET(request: Request) {
  try {
    // Consultar DynamoDB directamente
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });
    
    const response = await docClient.send(command);
    
    // Formatear la respuesta para la UI
    return NextResponse.json({
      success: true,
      data: response.Items || []
    });
  } catch (error) {
    console.error('Error al obtener investigaciones:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al consultar DynamoDB',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Obtener datos del body
    const data = await request.json();
    
    // Crear ID único para la investigación
    const id = `research-${uuid()}`;
    
    // Preparar el item para DynamoDB
    const item = {
      id: id,
      userId: data.userId || "testuser",
      basic: {
        name: data.name || "Nueva investigación",
        enterprise: data.enterprise || "Empresa",
        type: data.type || "eye-tracking",
        technique: data.technique || "aim-framework"
      },
      status: "draft",
      currentStage: "build",
      stageProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Guardar directamente en DynamoDB
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    });
    
    await docClient.send(command);
    
    // Devolver el ID creado
    return NextResponse.json({
      success: true,
      data: item,
      message: "Investigación creada correctamente"
    });
  } catch (error) {
    console.error('Error al crear investigación:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear investigación en DynamoDB',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Para manejar requisitos de configuración de Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 