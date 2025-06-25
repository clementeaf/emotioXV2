// Script temporal para depurar el problema de hitZones en public-tests
// Este archivo se puede eliminar después de resolver el issue

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

async function debugCognitiveTaskAPI() {
    // Usar el mismo researchId que aparece en los logs del usuario
    const researchId = '162a162c-ade1-88bd-fcdc-47a14a44adc5';

    // Token de ejemplo - necesitarías usar un token real para la prueba
    const token = 'PLACEHOLDER_TOKEN';

    try {
        console.log('🔍 DEBUGGER: Iniciando depuración de hitZones...');
        console.log(`📡 Fetching: ${API_BASE_URL}/research/${researchId}/cognitive-task`);

        const response = await fetch(`${API_BASE_URL}/research/${researchId}/cognitive-task`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`📊 Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error('❌ Response error:', response.status, response.statusText);
            return;
        }

        const data = await response.json();
        console.log('📋 Raw response data:', JSON.stringify(data, null, 2));

        // Verificar estructura de preguntas
        const questions = data?.questions || [];
        console.log(`📝 Total questions: ${questions.length}`);

        // Buscar preguntas de navigation_flow
        const navigationQuestions = questions.filter(q => q.type === 'navigation_flow');
        console.log(`🗺️ Navigation flow questions: ${navigationQuestions.length}`);

        navigationQuestions.forEach((question, index) => {
            console.log(`\n📍 Navigation Question ${index + 1}:`);
            console.log(`   ID: ${question.id}`);
            console.log(`   Title: ${question.title}`);
            console.log(`   Files count: ${question.files?.length || 0}`);

            if (question.files && question.files.length > 0) {
                question.files.forEach((file, fileIndex) => {
                    console.log(`\n   📁 File ${fileIndex + 1}:`);
                    console.log(`      Name: ${file.name}`);
                    console.log(`      ID: ${file.id}`);
                    console.log(`      URL: ${file.url}`);
                    console.log(`      S3Key: ${file.s3Key}`);
                    console.log(`      🎯 hitZones present: ${!!file.hitZones}`);
                    console.log(`      🎯 hitZones type: ${typeof file.hitZones}`);
                    console.log(`      🎯 hitZones value:`, file.hitZones);

                    if (file.hitZones && Array.isArray(file.hitZones)) {
                        console.log(`      🎯 hitZones count: ${file.hitZones.length}`);
                        file.hitZones.forEach((hz, hzIndex) => {
                            console.log(`         Zone ${hzIndex + 1}:`, hz);
                        });
                    }
                });
            }
        });

        console.log('\n✅ DEBUGGER: Depuración completada');

    } catch (error) {
        console.error('💥 DEBUGGER ERROR:', error);
    }
}

// Para usar en browser console:
// debugCognitiveTaskAPI();

console.log('🐛 Debug script loaded. Para ejecutar la depuración, copia y pega en la consola del navegador:');
console.log('debugCognitiveTaskAPI();');
