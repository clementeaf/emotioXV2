#!/usr/bin/env python3
import boto3
import sys
from datetime import datetime

# Configuración
region = 'us-east-1'
exclude_table = 'emotioxv2-backend-users-dev'  # Tabla a preservar (contiene usuario clemente@gmail.com)

print(f"Iniciando limpieza de tablas DynamoDB en {region} el {datetime.now()}")
print(f"NOTA: No se limpiará la tabla {exclude_table}")

# Crear cliente de DynamoDB
dynamodb = boto3.client('dynamodb', region_name=region)

# Obtener lista de tablas
response = dynamodb.list_tables()
tables = response['TableNames']

# Si hay más tablas (paginación)
while 'LastEvaluatedTableName' in response:
    response = dynamodb.list_tables(ExclusiveStartTableName=response['LastEvaluatedTableName'])
    tables.extend(response['TableNames'])

print(f"Tablas encontradas: {len(tables)}")

# Procesar cada tabla
for table_name in tables:
    if table_name == exclude_table:
        print(f"Saltando tabla {table_name} (contiene datos de usuario a preservar)")
        continue
        
    print(f"Procesando tabla: {table_name}")
    
    # Obtener información sobre la clave primaria de la tabla
    table_desc = dynamodb.describe_table(TableName=table_name)
    key_schema = table_desc['Table']['KeySchema']
    
    # Identificar nombres de campos de la clave primaria
    partition_key = next((item['AttributeName'] for item in key_schema if item['KeyType'] == 'HASH'), None)
    sort_key = next((item['AttributeName'] for item in key_schema if item['KeyType'] == 'RANGE'), None)
    
    if not partition_key:
        print(f"  ⚠️ No se pudo determinar la clave primaria para {table_name}, saltando...")
        continue
        
    print(f"  Clave primaria: {partition_key}" + (f", Clave de ordenación: {sort_key}" if sort_key else ""))
    
    # Escanear los elementos
    scan_args = {'TableName': table_name}
    items_deleted = 0
    
    try:
        while True:
            response = dynamodb.scan(**scan_args)
            items = response.get('Items', [])
            
            if not items:
                print(f"  No se encontraron elementos para eliminar")
                break
                
            print(f"  Encontrados {len(items)} elementos para eliminar")
            
            # Eliminar cada elemento
            for item in items:
                try:
                    delete_key = {partition_key: item[partition_key]}
                    if sort_key and sort_key in item:
                        delete_key[sort_key] = item[sort_key]
                        
                    dynamodb.delete_item(
                        TableName=table_name,
                        Key=delete_key
                    )
                    items_deleted += 1
                except Exception as e:
                    print(f"  ⚠️ Error al eliminar elemento: {str(e)}")
            
            # Si hay más elementos (paginación)
            if 'LastEvaluatedKey' in response:
                scan_args['ExclusiveStartKey'] = response['LastEvaluatedKey']
            else:
                break
                
        print(f"  ✅ Eliminados {items_deleted} elementos de {table_name}")
    except Exception as e:
        print(f"  ❌ Error al procesar tabla {table_name}: {str(e)}")

print(f"\nProceso de limpieza completado a las {datetime.now()}")
