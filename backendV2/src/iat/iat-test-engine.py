#!/usr/bin/env python3
"""
IAT Test Engine - Motor completo de ejecución de pruebas IAT
Implementa la lógica completa de pruebas de asociación implícita
"""

import sys
import json
import time
import random
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import pandas as pd
import numpy as np

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IATBlockType(Enum):
    """Tipos de bloques IAT"""
    PRACTICE_CATEGORIES = "practice_categories"
    PRACTICE_ATTRIBUTES = "practice_attributes"
    PRACTICE_COMBINED = "practice_combined"
    TEST_COMBINED = "test_combined"
    REVERSE_CATEGORIES = "reverse_categories"
    REVERSE_COMBINED = "reverse_combined"

class IATStimulusType(Enum):
    """Tipos de estímulos IAT"""
    CATEGORY_LEFT = "category_left"
    CATEGORY_RIGHT = "category_right"
    ATTRIBUTE_LEFT = "attribute_left"
    ATTRIBUTE_RIGHT = "attribute_right"
    COMBINED_LEFT = "combined_left"
    COMBINED_RIGHT = "combined_right"

@dataclass
class IATStimulus:
    """Estímulo individual en la prueba IAT"""
    text: str
    category: str
    attribute: str
    correct_response: str  # 'left' o 'right'
    stimulus_type: IATStimulusType
    block_number: int
    trial_number: int

@dataclass
class IATBlock:
    """Bloque de la prueba IAT"""
    block_number: int
    block_type: IATBlockType
    instructions: str
    stimuli: List[IATStimulus]
    is_practice: bool
    is_reverse: bool

@dataclass
class IATResponse:
    """Respuesta del participante"""
    trial_number: int
    block_number: int
    stimulus: str
    response: str  # 'left' o 'right'
    response_time: int  # milisegundos
    correct: bool
    timestamp: str

@dataclass
class IATTestConfig:
    """Configuración de la prueba IAT"""
    test_id: str
    name: str
    description: str
    categories: Dict[str, List[str]]
    attributes: Dict[str, List[str]]
    instructions: Dict[str, str]
    timing: Dict[str, int]
    blocks_config: List[Dict[str, Any]]

class IATTestEngine:
    """Motor principal de ejecución de pruebas IAT"""
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.IATTestEngine")
        self.current_test: Optional[IATTestConfig] = None
        self.current_session: Optional[str] = None
        self.responses: List[IATResponse] = []
        self.start_time: Optional[float] = None
        
    def create_test_config(self, config_data: Dict[str, Any]) -> IATTestConfig:
        """Crea una configuración de prueba IAT"""
        try:
            self.logger.info("Creando configuración de prueba IAT")
            
            # Validar datos requeridos
            required_fields = ['test_id', 'name', 'categories', 'attributes']
            for field in required_fields:
                if field not in config_data:
                    raise ValueError(f"Campo requerido faltante: {field}")
            
            # Crear configuración con valores por defecto
            config = IATTestConfig(
                test_id=config_data['test_id'],
                name=config_data['name'],
                description=config_data.get('description', ''),
                categories=config_data['categories'],
                attributes=config_data['attributes'],
                instructions=config_data.get('instructions', self._get_default_instructions()),
                timing=config_data.get('timing', self._get_default_timing()),
                blocks_config=config_data.get('blocks_config', self._get_default_blocks_config())
            )
            
            self.current_test = config
            self.logger.info(f"Configuración IAT creada: {config.test_id}")
            return config
            
        except Exception as e:
            self.logger.error(f"Error creando configuración IAT: {str(e)}")
            raise
    
    def start_session(self, session_id: str, participant_id: str) -> Dict[str, Any]:
        """Inicia una nueva sesión de prueba IAT"""
        try:
            if not self.current_test:
                raise ValueError("No hay configuración de prueba cargada")
            
            self.current_session = session_id
            self.responses = []
            self.start_time = time.time()
            
            # Generar bloques de la prueba
            blocks = self._generate_test_blocks()
            
            self.logger.info(f"Sesión IAT iniciada: {session_id}")
            
            # Convertir bloques a diccionarios serializables
            serializable_blocks = []
            for block in blocks:
                block_dict = {
                    'block_number': block.block_number,
                    'block_type': block.block_type.value,
                    'instructions': block.instructions,
                    'stimuli': [
                        {
                            'text': stimulus.text,
                            'category': stimulus.category,
                            'attribute': stimulus.attribute,
                            'correct_response': stimulus.correct_response,
                            'stimulus_type': stimulus.stimulus_type.value,
                            'block_number': stimulus.block_number,
                            'trial_number': stimulus.trial_number
                        } for stimulus in block.stimuli
                    ],
                    'is_practice': block.is_practice,
                    'is_reverse': block.is_reverse
                }
                serializable_blocks.append(block_dict)
            
            return {
                'session_id': session_id,
                'participant_id': participant_id,
                'test_config': asdict(self.current_test),
                'blocks': serializable_blocks,
                'total_blocks': len(blocks),
                'start_time': time.time()
            }
            
        except Exception as e:
            self.logger.error(f"Error iniciando sesión IAT: {str(e)}")
            raise
    
    def process_response(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesa una respuesta del participante"""
        try:
            # Validar datos de respuesta
            required_fields = ['trial_number', 'block_number', 'stimulus', 'response', 'response_time']
            for field in required_fields:
                if field not in response_data:
                    raise ValueError(f"Campo requerido faltante en respuesta: {field}")
            
            # Crear objeto de respuesta
            response = IATResponse(
                trial_number=response_data['trial_number'],
                block_number=response_data['block_number'],
                stimulus=response_data['stimulus'],
                response=response_data['response'],
                response_time=response_data['response_time'],
                correct=response_data.get('correct', False),
                timestamp=time.strftime('%Y-%m-%d %H:%M:%S')
            )
            
            # Agregar a la lista de respuestas
            self.responses.append(response)
            
            # Determinar si es la última respuesta
            is_last_response = self._is_last_response(response)
            
            self.logger.info(f"Respuesta procesada: Trial {response.trial_number}, Block {response.block_number}")
            
            return {
                'response_id': len(self.responses),
                'correct': response.correct,
                'is_last_response': is_last_response,
                'progress': self._calculate_progress(),
                'next_stimulus': self._get_next_stimulus() if not is_last_response else None
            }
            
        except Exception as e:
            self.logger.error(f"Error procesando respuesta: {str(e)}")
            raise
    
    def get_session_results(self) -> Dict[str, Any]:
        """Obtiene los resultados de la sesión actual"""
        try:
            if not self.responses:
                return {'error': 'No hay respuestas en la sesión'}
            
            # Convertir respuestas a DataFrame para análisis
            df = pd.DataFrame([asdict(r) for r in self.responses])
            
            # Calcular estadísticas básicas
            total_responses = len(df)
            correct_responses = len(df[df['correct'] == True])
            accuracy = (correct_responses / total_responses) * 100 if total_responses > 0 else 0
            
            # Calcular tiempos de respuesta promedio
            mean_rt = df['response_time'].mean()
            median_rt = df['response_time'].median()
            std_rt = df['response_time'].std()
            
            # Separar por bloques
            block_stats = {}
            for block_num in df['block_number'].unique():
                block_data = df[df['block_number'] == block_num]
                block_stats[f'block_{block_num}'] = {
                    'count': len(block_data),
                    'accuracy': (len(block_data[block_data['correct'] == True]) / len(block_data)) * 100,
                    'mean_rt': float(block_data['response_time'].mean()),
                    'std_rt': float(block_data['response_time'].std())
                }
            
            # Calcular D-Score básico
            d_score = self._calculate_d_score(df)
            
            results = {
                'session_id': self.current_session,
                'total_responses': total_responses,
                'accuracy': float(accuracy),
                'mean_response_time': float(mean_rt),
                'median_response_time': float(median_rt),
                'std_response_time': float(std_rt),
                'd_score': float(d_score),
                'block_statistics': block_stats,
                'raw_responses': [asdict(r) for r in self.responses],
                'session_duration': time.time() - self.start_time if self.start_time else 0
            }
            
            self.logger.info(f"Resultados calculados para sesión: {self.current_session}")
            return results
            
        except Exception as e:
            self.logger.error(f"Error calculando resultados: {str(e)}")
            raise
    
    def _generate_test_blocks(self) -> List[IATBlock]:
        """Genera los bloques de la prueba IAT"""
        if not self.current_test:
            raise ValueError("No hay configuración de prueba")
        
        blocks = []
        block_number = 1
        
        # Bloque 1: Práctica de categorías (izquierda)
        blocks.append(self._create_practice_categories_block(block_number, 'left'))
        block_number += 1
        
        # Bloque 2: Práctica de atributos (derecha)
        blocks.append(self._create_practice_attributes_block(block_number, 'right'))
        block_number += 1
        
        # Bloque 3: Práctica combinada (compatible)
        blocks.append(self._create_combined_practice_block(block_number, 'compatible'))
        block_number += 1
        
        # Bloque 4: Prueba combinada (compatible)
        blocks.append(self._create_combined_test_block(block_number, 'compatible'))
        block_number += 1
        
        # Bloque 5: Práctica de categorías (derecha - reverso)
        blocks.append(self._create_practice_categories_block(block_number, 'right'))
        block_number += 1
        
        # Bloque 6: Práctica combinada (incompatible)
        blocks.append(self._create_combined_practice_block(block_number, 'incompatible'))
        block_number += 1
        
        # Bloque 7: Prueba combinada (incompatible)
        blocks.append(self._create_combined_test_block(block_number, 'incompatible'))
        
        return blocks
    
    def _create_practice_categories_block(self, block_number: int, side: str) -> IATBlock:
        """Crea bloque de práctica de categorías"""
        categories = self.current_test.categories[side]
        stimuli = []
        
        for i, category in enumerate(categories):
            stimulus = IATStimulus(
                text=category,
                category=category,
                attribute='',
                correct_response=side,
                stimulus_type=IATStimulusType.CATEGORY_LEFT if side == 'left' else IATStimulusType.CATEGORY_RIGHT,
                block_number=block_number,
                trial_number=i + 1
            )
            stimuli.append(stimulus)
        
        return IATBlock(
            block_number=block_number,
            block_type=IATBlockType.PRACTICE_CATEGORIES,
            instructions=f"Clasifica las palabras en la categoría {side}",
            stimuli=stimuli,
            is_practice=True,
            is_reverse=False
        )
    
    def _create_practice_attributes_block(self, block_number: int, side: str) -> IATBlock:
        """Crea bloque de práctica de atributos"""
        attributes = self.current_test.attributes[side]
        stimuli = []
        
        for i, attribute in enumerate(attributes):
            stimulus = IATStimulus(
                text=attribute,
                category='',
                attribute=attribute,
                correct_response=side,
                stimulus_type=IATStimulusType.ATTRIBUTE_LEFT if side == 'left' else IATStimulusType.ATTRIBUTE_RIGHT,
                block_number=block_number,
                trial_number=i + 1
            )
            stimuli.append(stimulus)
        
        return IATBlock(
            block_number=block_number,
            block_type=IATBlockType.PRACTICE_ATTRIBUTES,
            instructions=f"Clasifica las palabras en el atributo {side}",
            stimuli=stimuli,
            is_practice=True,
            is_reverse=False
        )
    
    def _create_combined_practice_block(self, block_number: int, compatibility: str) -> IATBlock:
        """Crea bloque de práctica combinada"""
        # Combinar categorías y atributos
        left_categories = self.current_test.categories['left']
        right_categories = self.current_test.categories['right']
        left_attributes = self.current_test.attributes['left']
        right_attributes = self.current_test.attributes['right']
        
        stimuli = []
        trial_number = 1
        
        # Agregar estímulos de categorías
        for category in left_categories + right_categories:
            correct_response = 'left' if category in left_categories else 'right'
            stimulus = IATStimulus(
                text=category,
                category=category,
                attribute='',
                correct_response=correct_response,
                stimulus_type=IATStimulusType.COMBINED_LEFT if correct_response == 'left' else IATStimulusType.COMBINED_RIGHT,
                block_number=block_number,
                trial_number=trial_number
            )
            stimuli.append(stimulus)
            trial_number += 1
        
        # Agregar estímulos de atributos
        for attribute in left_attributes + right_attributes:
            correct_response = 'left' if attribute in left_attributes else 'right'
            stimulus = IATStimulus(
                text=attribute,
                category='',
                attribute=attribute,
                correct_response=correct_response,
                stimulus_type=IATStimulusType.COMBINED_LEFT if correct_response == 'left' else IATStimulusType.COMBINED_RIGHT,
                block_number=block_number,
                trial_number=trial_number
            )
            stimuli.append(stimulus)
            trial_number += 1
        
        # Mezclar estímulos
        random.shuffle(stimuli)
        for i, stimulus in enumerate(stimuli):
            stimulus.trial_number = i + 1
        
        return IATBlock(
            block_number=block_number,
            block_type=IATBlockType.PRACTICE_COMBINED,
            instructions=f"Clasifica las palabras según categoría y atributo ({compatibility})",
            stimuli=stimuli,
            is_practice=True,
            is_reverse=(compatibility == 'incompatible')
        )
    
    def _create_combined_test_block(self, block_number: int, compatibility: str) -> IATBlock:
        """Crea bloque de prueba combinada"""
        # Similar a práctica pero con más repeticiones
        practice_block = self._create_combined_practice_block(block_number, compatibility)
        
        # Duplicar estímulos para hacer el bloque más largo
        extended_stimuli = []
        for _ in range(2):  # Duplicar una vez
            for stimulus in practice_block.stimuli:
                new_stimulus = IATStimulus(
                    text=stimulus.text,
                    category=stimulus.category,
                    attribute=stimulus.attribute,
                    correct_response=stimulus.correct_response,
                    stimulus_type=stimulus.stimulus_type,
                    block_number=stimulus.block_number,
                    trial_number=len(extended_stimuli) + 1
                )
                extended_stimuli.append(new_stimulus)
        
        # Mezclar estímulos
        random.shuffle(extended_stimuli)
        for i, stimulus in enumerate(extended_stimuli):
            stimulus.trial_number = i + 1
        
        return IATBlock(
            block_number=block_number,
            block_type=IATBlockType.TEST_COMBINED,
            instructions=f"Clasifica las palabras según categoría y atributo ({compatibility}) - PRUEBA",
            stimuli=extended_stimuli,
            is_practice=False,
            is_reverse=(compatibility == 'incompatible')
        )
    
    def _is_last_response(self, response: IATResponse) -> bool:
        """Determina si es la última respuesta de la prueba"""
        # Lógica simple: si es el último bloque y último trial
        return response.block_number == 7 and response.trial_number >= 20
    
    def _calculate_progress(self) -> float:
        """Calcula el progreso de la prueba (0.0 a 1.0)"""
        if not self.responses:
            return 0.0
        
        # Estimación basada en respuestas recibidas
        total_expected = 7 * 20  # 7 bloques, ~20 trials cada uno
        return min(len(self.responses) / total_expected, 1.0)
    
    def _get_next_stimulus(self) -> Optional[Dict[str, Any]]:
        """Obtiene el siguiente estímulo a mostrar"""
        # Lógica simplificada - en implementación real sería más compleja
        return None
    
    def _calculate_d_score(self, df: pd.DataFrame) -> float:
        """Calcula el D-Score usando la fórmula estándar"""
        try:
            # Separar bloques compatibles (3, 4) e incompatibles (6, 7)
            compatible_blocks = df[df['block_number'].isin([3, 4])]
            incompatible_blocks = df[df['block_number'].isin([6, 7])]
            
            if len(compatible_blocks) == 0 or len(incompatible_blocks) == 0:
                return 0.0
            
            # Calcular tiempos de respuesta promedio
            mean_rt_compatible = compatible_blocks['response_time'].mean()
            mean_rt_incompatible = incompatible_blocks['response_time'].mean()
            
            # Calcular desviación estándar combinada
            std_compatible = compatible_blocks['response_time'].std()
            std_incompatible = incompatible_blocks['response_time'].std()
            combined_std = (std_compatible + std_incompatible) / 2
            
            if combined_std == 0:
                return 0.0
            
            # Fórmula D-Score: (RT_incompatible - RT_compatible) / std_combined
            d_score = (mean_rt_incompatible - mean_rt_compatible) / combined_std
            
            return float(d_score)
            
        except Exception as e:
            self.logger.error(f"Error calculando D-Score: {str(e)}")
            return 0.0
    
    def _get_default_instructions(self) -> Dict[str, str]:
        """Instrucciones por defecto para la prueba IAT"""
        return {
            'welcome': 'Bienvenido a la prueba de asociación implícita',
            'practice': 'Esta es una sesión de práctica',
            'test': 'Esta es la prueba real',
            'reverse': 'Las categorías han cambiado de lado',
            'complete': '¡Prueba completada!'
        }
    
    def _get_default_timing(self) -> Dict[str, int]:
        """Timing por defecto para la prueba IAT"""
        return {
            'stimulus_duration': 2000,  # 2 segundos
            'response_timeout': 5000,    # 5 segundos
            'feedback_duration': 1000,   # 1 segundo
            'block_break': 3000         # 3 segundos entre bloques
        }
    
    def _get_default_blocks_config(self) -> List[Dict[str, Any]]:
        """Configuración por defecto de bloques"""
        return [
            {'type': 'practice_categories', 'trials': 10, 'is_practice': True},
            {'type': 'practice_attributes', 'trials': 10, 'is_practice': True},
            {'type': 'practice_combined', 'trials': 20, 'is_practice': True},
            {'type': 'test_combined', 'trials': 40, 'is_practice': False},
            {'type': 'reverse_categories', 'trials': 10, 'is_practice': True},
            {'type': 'reverse_combined', 'trials': 20, 'is_practice': True},
            {'type': 'reverse_test', 'trials': 40, 'is_practice': False}
        ]

def main():
    """Función principal para comunicación con Node.js"""
    try:
        # Leer datos desde stdin
        input_data = json.loads(sys.stdin.read())
        action = input_data.get('action')
        
        engine = IATTestEngine()
        
        if action == 'create_config':
            config = engine.create_test_config(input_data.get('config', {}))
            result = {'success': True, 'config': asdict(config)}
            
        elif action == 'start_session':
            # Crear configuración si no existe
            if not engine.current_test:
                config = engine.create_test_config(input_data.get('test_config', {}))
            
            session_data = engine.start_session(
                input_data.get('session_id', ''),
                input_data.get('participant_id', '')
            )
            result = {'success': True, 'session': session_data}
            
        elif action == 'process_response':
            response_result = engine.process_response(input_data.get('response', {}))
            result = {'success': True, 'result': response_result}
            
        elif action == 'get_results':
            results = engine.get_session_results()
            result = {'success': True, 'results': results}
            
        else:
            result = {'success': False, 'error': f'Acción no reconocida: {action}'}
        
        # Enviar resultado a stdout
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': f'Error en IAT Test Engine: {str(e)}',
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        print(json.dumps(error_result, ensure_ascii=False))

if __name__ == "__main__":
    main()
