# Script para limpiar todos los recursos de AWS
# ADVERTENCIA: Este script eliminará TODOS los recursos en los servicios especificados
# Ejecutar con precaución

Write-Host "ADVERTENCIA: Este script eliminará TODOS los recursos de AWS en tu cuenta." -ForegroundColor Red
Write-Host "Esto incluye CloudFormation stacks, Lambda functions, API Gateway, DynamoDB tables, etc." -ForegroundColor Red
Write-Host "Esta acción NO SE PUEDE DESHACER." -ForegroundColor Red
$confirmation = Read-Host "¿Estás seguro que deseas continuar? (escribe 'SI' para confirmar)"

if ($confirmation -ne "SI") {
    Write-Host "Operación cancelada." -ForegroundColor Yellow
    exit
}

$region = "us-east-1"  # Cambia esto si usas otra región

# Función para mostrar progreso
function Show-Progress {
    param (
        [string]$Message
    )
    Write-Host "===> $Message" -ForegroundColor Cyan
}

# 1. Eliminar CloudFormation Stacks
Show-Progress "Eliminando CloudFormation Stacks..."
$stacks = aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE --region $region --query "StackSummaries[].StackName" --output text
if ($stacks) {
    $stacks -split "\t" | ForEach-Object {
        if ($_) {
            Write-Host "Eliminando stack: $_" -ForegroundColor Yellow
            aws cloudformation delete-stack --stack-name $_ --region $region
            Write-Host "Esperando a que se elimine el stack $_..." -ForegroundColor Yellow
            aws cloudformation wait stack-delete-complete --stack-name $_ --region $region
        }
    }
}

# 2. Eliminar Lambda Functions
Show-Progress "Eliminando Lambda Functions..."
$functions = aws lambda list-functions --region $region --query "Functions[].FunctionName" --output text
if ($functions) {
    $functions -split "\t" | ForEach-Object {
        if ($_) {
            Write-Host "Eliminando función Lambda: $_" -ForegroundColor Yellow
            aws lambda delete-function --function-name $_ --region $region
        }
    }
}

# 3. Eliminar API Gateway APIs (REST)
Show-Progress "Eliminando API Gateway REST APIs..."
$restApis = aws apigateway get-rest-apis --region $region --query "items[].id" --output text
if ($restApis) {
    $restApis -split "\t" | ForEach-Object {
        if ($_) {
            Write-Host "Eliminando REST API: $_" -ForegroundColor Yellow
            aws apigateway delete-rest-api --rest-api-id $_ --region $region
        }
    }
}

# 4. Eliminar API Gateway APIs (HTTP)
Show-Progress "Eliminando API Gateway HTTP APIs..."
$httpApis = aws apigatewayv2 get-apis --region $region --query "Items[].ApiId" --output text
if ($httpApis) {
    $httpApis -split "\t" | ForEach-Object {
        if ($_) {
            Write-Host "Eliminando HTTP API: $_" -ForegroundColor Yellow
            aws apigatewayv2 delete-api --api-id $_ --region $region
        }
    }
}

# 5. Eliminar DynamoDB Tables
Show-Progress "Eliminando DynamoDB Tables..."
$tables = aws dynamodb list-tables --region $region --query "TableNames[]" --output text
if ($tables) {
    $tables -split "\t" | ForEach-Object {
        if ($_) {
            Write-Host "Eliminando tabla DynamoDB: $_" -ForegroundColor Yellow
            aws dynamodb delete-table --table-name $_ --region $region
        }
    }
}

# 6. Eliminar S3 Buckets
Show-Progress "Eliminando S3 Buckets..."
$buckets = aws s3api list-buckets --query "Buckets[].Name" --output text
if ($buckets) {
    $buckets -split "\t" | ForEach-Object {
        if ($_) {
            # Verificar si el bucket está en la región correcta
            $bucketRegion = aws s3api get-bucket-location --bucket $_ --query "LocationConstraint" --output text
            if ($bucketRegion -eq "null") { $bucketRegion = "us-east-1" }
            if ($bucketRegion -eq $region) {
                Write-Host "Vaciando y eliminando bucket S3: $_" -ForegroundColor Yellow
                aws s3 rm s3://$_ --recursive
                aws s3api delete-bucket --bucket $_
            }
        }
    }
}

# 7. Eliminar CloudWatch Log Groups
Show-Progress "Eliminando CloudWatch Log Groups..."
$logGroups = aws logs describe-log-groups --region $region --query "logGroups[].logGroupName" --output text
if ($logGroups) {
    $logGroups -split "\t" | ForEach-Object {
        if ($_) {
            Write-Host "Eliminando Log Group: $_" -ForegroundColor Yellow
            aws logs delete-log-group --log-group-name $_ --region $region
        }
    }
}

# 8. Eliminar IAM Roles (solo los creados por serverless/CloudFormation)
Show-Progress "Eliminando IAM Roles relacionados con serverless..."
$roles = aws iam list-roles --query "Roles[?contains(RoleName, 'serverless') || contains(RoleName, 'emotiox') || contains(RoleName, 'lambda')].RoleName" --output text
if ($roles) {
    $roles -split "\t" | ForEach-Object {
        if ($_) {
            $roleName = $_
            Write-Host "Procesando rol IAM: $roleName" -ForegroundColor Yellow
            
            # Eliminar políticas adjuntas
            $attachedPolicies = aws iam list-attached-role-policies --role-name $roleName --query "AttachedPolicies[].PolicyArn" --output text
            if ($attachedPolicies) {
                $attachedPolicies -split "\t" | ForEach-Object {
                    if ($_) {
                        $policyArn = $_
                        Write-Host "Desvinculando política: $policyArn" -ForegroundColor Yellow
                        aws iam detach-role-policy --role-name $roleName --policy-arn $policyArn
                    }
                }
            }
            
            # Eliminar políticas en línea
            $inlinePolicies = aws iam list-role-policies --role-name $roleName --output text
            if ($inlinePolicies) {
                $inlinePolicies -split "\t" | ForEach-Object {
                    if ($_) {
                        $policyName = $_
                        Write-Host "Eliminando política en línea: $policyName" -ForegroundColor Yellow
                        aws iam delete-role-policy --role-name $roleName --policy-name $policyName
                    }
                }
            }
            
            # Eliminar el rol
            Write-Host "Eliminando rol: $roleName" -ForegroundColor Yellow
            aws iam delete-role --role-name $roleName
        }
    }
}

Write-Host "Limpieza completada. Todos los recursos especificados han sido eliminados." -ForegroundColor Green
Write-Host "Nota: Es posible que algunos recursos no se hayan eliminado si tienen dependencias o protecciones especiales." -ForegroundColor Yellow
Write-Host "Verifica manualmente en la consola de AWS si necesitas eliminar recursos adicionales." -ForegroundColor Yellow 