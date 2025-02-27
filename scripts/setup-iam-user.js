const AWS = require('aws-sdk');
const { execSync } = require('child_process');

async function createIAMUser(iam, username) {
  try {
    await iam.getUser({ UserName: username }).promise();
    console.log(`Usuario IAM ${username} ya existe.`);
  } catch (error) {
    if (error.code === 'NoSuchEntity') {
      await iam.createUser({ UserName: username }).promise();
      console.log(`Usuario IAM ${username} creado exitosamente.`);
    } else {
      throw error;
    }
  }
}

async function createPolicy(iam, policyName, policyDocument) {
  try {
    const policy = await iam.createPolicy({
      PolicyName: policyName,
      PolicyDocument: JSON.stringify(policyDocument),
    }).promise();
    return policy.Policy.Arn;
  } catch (error) {
    if (error.code === 'EntityAlreadyExists') {
      const policies = await iam.listPolicies({
        Scope: 'Local',
        PathPrefix: '/'
      }).promise();
      const existingPolicy = policies.Policies.find(p => p.PolicyName === policyName);
      return existingPolicy.Arn;
    }
    throw error;
  }
}

async function setupIAMUser(env) {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accountId = execSync('aws sts get-caller-identity --query Account --output text', { encoding: 'utf-8' }).trim();
  
  const iam = new AWS.IAM();
  const username = `emotiox-${env}-user`;
  
  // 1. Crear usuario IAM
  await createIAMUser(iam, username);

  // 2. Crear política para DynamoDB
  const dynamoPolicy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem'
      ],
      Resource: [
        `arn:aws:dynamodb:${region}:${accountId}:table/emotiox-v2-${env}-emotions`,
        `arn:aws:dynamodb:${region}:${accountId}:table/emotiox-v2-${env}-emotions/index/*`
      ]
    }]
  };

  // 3. Crear política para S3
  const s3Policy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: [
        's3:PutObject',
        's3:GetObject',
        's3:DeleteObject',
        's3:ListBucket'
      ],
      Resource: [
        `arn:aws:s3:::emotiox-v2-${env}-storage-${accountId}`,
        `arn:aws:s3:::emotiox-v2-${env}-storage-${accountId}/*`
      ]
    }]
  };

  // 4. Crear política para Lambda
  const lambdaPolicy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: [
        'lambda:InvokeFunction',
        'lambda:GetFunction',
        'lambda:UpdateFunctionCode',
        'lambda:UpdateFunctionConfiguration'
      ],
      Resource: `arn:aws:lambda:${region}:${accountId}:function:emotiox-v2-${env}-*`
    }]
  };

  // 5. Crear política para CloudWatch Logs
  const logsPolicy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams'
      ],
      Resource: `arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/emotiox-v2-${env}-*:*`
    }]
  };

  // 6. Crear las políticas en AWS
  const dynamoPolicyArn = await createPolicy(iam, `EmotioX-${env}-DynamoDB`, dynamoPolicy);
  const s3PolicyArn = await createPolicy(iam, `EmotioX-${env}-S3`, s3Policy);
  const lambdaPolicyArn = await createPolicy(iam, `EmotioX-${env}-Lambda`, lambdaPolicy);
  const logsPolicyArn = await createPolicy(iam, `EmotioX-${env}-Logs`, logsPolicy);

  // 7. Adjuntar políticas al usuario
  const policies = [dynamoPolicyArn, s3PolicyArn, lambdaPolicyArn, logsPolicyArn];
  for (const policyArn of policies) {
    try {
      await iam.attachUserPolicy({
        UserName: username,
        PolicyArn: policyArn
      }).promise();
      console.log(`Política ${policyArn} adjuntada al usuario ${username}`);
    } catch (error) {
      if (error.code !== 'EntityAlreadyExists') {
        throw error;
      }
    }
  }

  // 8. Crear access key para el usuario
  try {
    const accessKey = await iam.createAccessKey({
      UserName: username
    }).promise();

    console.log('\nCredenciales generadas exitosamente:');
    console.log('=================================');
    console.log(`Access Key ID: ${accessKey.AccessKey.AccessKeyId}`);
    console.log(`Secret Access Key: ${accessKey.AccessKey.SecretAccessKey}`);
    console.log('\nPor favor, guarda estas credenciales de forma segura.');
    console.log('\nPara configurar el perfil AWS, ejecuta:');
    console.log(`aws configure --profile ${env}`);
    
  } catch (error) {
    if (error.code === 'LimitExceeded') {
      console.log('El usuario ya tiene el máximo de access keys permitidas.');
      console.log('Por favor, elimina una access key existente antes de crear una nueva.');
    } else {
      throw error;
    }
  }
}

// Ejecutar el script
const env = process.argv[2];
if (!['dev', 'test', 'prod'].includes(env)) {
  console.error('Error: El ambiente debe ser dev, test o prod');
  process.exit(1);
}

setupIAMUser(env).catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 