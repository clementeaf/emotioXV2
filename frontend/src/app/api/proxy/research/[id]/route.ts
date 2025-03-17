import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, UpdateCommand, DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Inicializar cliente de DynamoDB
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Nombre de la tabla en DynamoDB
const TABLE_NAME = "emotio-x-backend-v2-dev-research";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    // Consultar DynamoDB directamente
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    });
    
    const response = await docClient.send(command);
    
    if (!response.Item) {
      return NextResponse.json({
        success: false,
        message: `No se encontró investigación con ID ${id}`
      }, { status: 404 });
    }
    
    // Devolver el item encontrado
    return NextResponse.json({
      success: true,
      data: response.Item
    });
  } catch (error) {
    console.error(`Error al obtener investigación ${id}:`, error);
    return NextResponse.json({
      success: false,
      message: 'Error al consultar DynamoDB',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    // Obtener datos a actualizar
    const updates = await request.json();
    
    // Verificar primero si el item existe
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    });
    
    const existingItem = await docClient.send(getCommand);
    
    if (!existingItem.Item) {
      return NextResponse.json({
        success: false,
        message: `No se encontró investigación con ID ${id}`
      }, { status: 404 });
    }
    
    // Preparar la actualización
    // Creamos expresiones de actualización basadas en los campos recibidos
    let updateExpression = "SET updatedAt = :updatedAt";
    const expressionAttributeValues: Record<string, any> = {
      ":updatedAt": new Date().toISOString()
    };
    
    // Actualizar los campos recibidos
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') { // No permitir cambiar el ID
        updateExpression += `, ${key} = :${key}`;
        expressionAttributeValues[`:${key}`] = value;
      }
    });
    
    // Ejecutar la actualización
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    });
    
    const result = await docClient.send(updateCommand);
    
    // Devolver el item actualizado
    return NextResponse.json({
      success: true,
      data: result.Attributes,
      message: "Investigación actualizada correctamente"
    });
  } catch (error) {
    console.error(`Error al actualizar investigación ${id}:`, error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar en DynamoDB',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    // Eliminar directamente de DynamoDB
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
      ReturnValues: "ALL_OLD"
    });
    
    const result = await docClient.send(command);
    
    if (!result.Attributes) {
      return NextResponse.json({
        success: false,
        message: `No se encontró investigación con ID ${id}`
      }, { status: 404 });
    }
    
    // Devolver confirmación
    return NextResponse.json({
      success: true,
      message: "Investigación eliminada correctamente"
    });
  } catch (error) {
    console.error(`Error al eliminar investigación ${id}:`, error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar de DynamoDB',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Para manejar requisitos de configuración de Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 