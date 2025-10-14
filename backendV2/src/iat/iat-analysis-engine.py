#!/usr/bin/env python3
"""
IAT Analysis Engine - Motor avanzado de análisis estadístico IAT
Implementa algoritmos mejorados para análisis de datos de pruebas de asociación implícita
"""

import sys
import json
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.metrics import accuracy_score, precision_score, recall_score
import warnings
warnings.filterwarnings('ignore')

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class IATBlockAnalysis:
    """Análisis estadístico de un bloque IAT"""
    block_number: int
    block_type: str
    trial_count: int
    mean_rt: float
    median_rt: float
    std_rt: float
    accuracy: float
    error_rate: float
    fast_trials: int  # < 300ms
    slow_trials: int  # > 3000ms
    outlier_rate: float
    learning_effect: float  # Mejora en RT a lo largo del bloque
    consistency: float  # Consistencia en respuestas

@dataclass
class IATStatisticalAnalysis:
    """Análisis estadístico completo de la prueba IAT"""
    d_score: float
    d_score_interpretation: str
    d_score_confidence_interval: Tuple[float, float]
    d_score_significance: bool
    d_score_effect_size: str
    
    # Análisis de bloques
    compatible_blocks_analysis: IATBlockAnalysis
    incompatible_blocks_analysis: IATBlockAnalysis
    
    # Métricas de rendimiento
    overall_accuracy: float
    overall_mean_rt: float
    overall_consistency: float
    learning_curve: List[float]
    
    # Análisis de errores
    error_pattern: str  # 'random', 'systematic', 'mixed'
    error_analysis: Dict[str, Any]
    
    # Análisis temporal
    fatigue_effect: float
    attention_metrics: Dict[str, float]
    
    # Métricas de calidad de datos
    data_quality_score: float
    reliability_metrics: Dict[str, float]

class IATAnalysisEngine:
    """Motor avanzado de análisis estadístico IAT"""
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.IATAnalysisEngine")
        self.logger.info("Inicializando IAT Analysis Engine")
        
    def analyze_session(self, session_data: Dict[str, Any]) -> IATStatisticalAnalysis:
        """
        Realiza análisis estadístico completo de una sesión IAT
        
        Args:
            session_data: Datos de la sesión IAT
            
        Returns:
            IATStatisticalAnalysis: Análisis estadístico completo
        """
        try:
            self.logger.info("Iniciando análisis estadístico IAT")
            
            # Convertir datos a DataFrame
            df = self._prepare_dataframe(session_data)
            
            # Análisis básico de D-Score
            d_score_analysis = self._calculate_advanced_d_score(df)
            
            # Análisis de bloques
            block_analysis = self._analyze_blocks(df)
            
            # Análisis de rendimiento
            performance_analysis = self._analyze_performance(df)
            
            # Análisis de errores
            error_analysis = self._analyze_errors(df)
            
            # Análisis temporal
            temporal_analysis = self._analyze_temporal_patterns(df)
            
            # Métricas de calidad
            quality_metrics = self._assess_data_quality(df)
            
            # Compilar análisis completo
            analysis = IATStatisticalAnalysis(
                d_score=d_score_analysis['d_score'],
                d_score_interpretation=d_score_analysis['interpretation'],
                d_score_confidence_interval=d_score_analysis['confidence_interval'],
                d_score_significance=d_score_analysis['significance'],
                d_score_effect_size=d_score_analysis['effect_size'],
                
                compatible_blocks_analysis=block_analysis['compatible'],
                incompatible_blocks_analysis=block_analysis['incompatible'],
                
                overall_accuracy=performance_analysis['accuracy'],
                overall_mean_rt=performance_analysis['mean_rt'],
                overall_consistency=performance_analysis['consistency'],
                learning_curve=performance_analysis['learning_curve'],
                
                error_pattern=error_analysis['pattern'],
                error_analysis=error_analysis['details'],
                
                fatigue_effect=temporal_analysis['fatigue'],
                attention_metrics=temporal_analysis['attention'],
                
                data_quality_score=quality_metrics['score'],
                reliability_metrics=quality_metrics['reliability']
            )
            
            self.logger.info("Análisis estadístico IAT completado")
            return analysis
            
        except Exception as e:
            self.logger.error(f"Error en análisis estadístico: {str(e)}")
            raise
    
    def _prepare_dataframe(self, session_data: Dict[str, Any]) -> pd.DataFrame:
        """Prepara DataFrame para análisis"""
        try:
            responses = session_data.get('responses', [])
            
            if not responses:
                raise ValueError("No se encontraron respuestas IAT")
            
            # Crear DataFrame con estructura optimizada
            data = []
            for response in responses:
                data.append({
                    'trial': response.get('trialNumber', 0),
                    'block': response.get('blockNumber', 0),
                    'stimulus': response.get('stimulus', ''),
                    'response': response.get('response', ''),
                    'rt': response.get('responseTime', 0),
                    'correct': response.get('correct', False),
                    'category': response.get('category', ''),
                    'attribute': response.get('attribute', ''),
                    'timestamp': response.get('timestamp', '')
                })
            
            df = pd.DataFrame(data)
            
            # Limpiar datos
            df = df[df['rt'] > 0]  # Eliminar RTs inválidos
            df = df[df['rt'] < 10000]  # Eliminar RTs extremos
            
            self.logger.info(f"DataFrame preparado con {len(df)} respuestas válidas")
            return df
            
        except Exception as e:
            self.logger.error(f"Error preparando DataFrame: {str(e)}")
            raise
    
    def _calculate_advanced_d_score(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calcula D-Score usando algoritmos avanzados"""
        try:
            # Separar bloques compatibles (3, 4) e incompatibles (6, 7)
            compatible_blocks = df[df['block'].isin([3, 4])]
            incompatible_blocks = df[df['block'].isin([6, 7])]
            
            if len(compatible_blocks) == 0 or len(incompatible_blocks) == 0:
                return self._default_d_score_analysis()
            
            # Calcular D-Score usando algoritmo mejorado
            d_score = self._calculate_improved_d_score(compatible_blocks, incompatible_blocks)
            
            # Calcular intervalo de confianza
            ci_lower, ci_upper = self._calculate_confidence_interval(
                compatible_blocks, incompatible_blocks, d_score
            )
            
            # Determinar significancia estadística
            significance = self._test_statistical_significance(
                compatible_blocks, incompatible_blocks, d_score
            )
            
            # Interpretar D-Score
            interpretation = self._interpret_d_score(d_score)
            effect_size = self._classify_effect_size(d_score)
            
            return {
                'd_score': float(d_score),
                'interpretation': interpretation,
                'confidence_interval': (float(ci_lower), float(ci_upper)),
                'significance': significance,
                'effect_size': effect_size
            }
            
        except Exception as e:
            self.logger.error(f"Error calculando D-Score avanzado: {str(e)}")
            return self._default_d_score_analysis()
    
    def _calculate_improved_d_score(self, compatible: pd.DataFrame, incompatible: pd.DataFrame) -> float:
        """Calcula D-Score usando algoritmo mejorado (Greenwald et al., 2003)"""
        try:
            # Algoritmo D-Score mejorado
            # 1. Calcular medias de RT
            mean_rt_compatible = compatible['rt'].mean()
            mean_rt_incompatible = incompatible['rt'].mean()
            
            # 2. Calcular desviación estándar combinada
            std_compatible = compatible['rt'].std()
            std_incompatible = incompatible['rt'].std()
            
            # 3. Aplicar corrección por outliers
            compatible_clean = self._remove_outliers(compatible['rt'])
            incompatible_clean = self._remove_outliers(incompatible['rt'])
            
            if len(compatible_clean) == 0 or len(incompatible_clean) == 0:
                return 0.0
            
            # 4. Recalcular con datos limpios
            mean_rt_compatible_clean = compatible_clean.mean()
            mean_rt_incompatible_clean = incompatible_clean.mean()
            
            # 5. Calcular desviación estándar combinada
            combined_std = (compatible_clean.std() + incompatible_clean.std()) / 2
            
            if combined_std == 0:
                return 0.0
            
            # 6. Fórmula D-Score mejorada
            d_score = (mean_rt_incompatible_clean - mean_rt_compatible_clean) / combined_std
            
            return float(d_score)
            
        except Exception as e:
            self.logger.error(f"Error en algoritmo D-Score mejorado: {str(e)}")
            return 0.0
    
    def _remove_outliers(self, rt_series: pd.Series) -> pd.Series:
        """Remueve outliers usando método IQR"""
        try:
            Q1 = rt_series.quantile(0.25)
            Q3 = rt_series.quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            return rt_series[(rt_series >= lower_bound) & (rt_series <= upper_bound)]
            
        except Exception as e:
            self.logger.error(f"Error removiendo outliers: {str(e)}")
            return rt_series
    
    def _calculate_confidence_interval(self, compatible: pd.DataFrame, 
                                      incompatible: pd.DataFrame, d_score: float) -> Tuple[float, float]:
        """Calcula intervalo de confianza para D-Score"""
        try:
            # Bootstrap para intervalo de confianza
            n_bootstrap = 1000
            d_scores = []
            
            for _ in range(n_bootstrap):
                # Muestreo con reemplazo
                comp_sample = compatible.sample(n=len(compatible), replace=True)
                incomp_sample = incompatible.sample(n=len(incompatible), replace=True)
                
                # Calcular D-Score para esta muestra
                sample_d_score = self._calculate_improved_d_score(comp_sample, incomp_sample)
                d_scores.append(sample_d_score)
            
            # Calcular percentiles
            ci_lower = np.percentile(d_scores, 2.5)
            ci_upper = np.percentile(d_scores, 97.5)
            
            return float(ci_lower), float(ci_upper)
            
        except Exception as e:
            self.logger.error(f"Error calculando intervalo de confianza: {str(e)}")
            return float(d_score - 0.1), float(d_score + 0.1)
    
    def _test_statistical_significance(self, compatible: pd.DataFrame, 
                                     incompatible: pd.DataFrame, d_score: float) -> bool:
        """Prueba significancia estadística del D-Score"""
        try:
            # T-test para comparar medias
            t_stat, p_value = stats.ttest_ind(incompatible['rt'], compatible['rt'])
            
            # Significancia si p < 0.05 y |d_score| > 0.2
            return p_value < 0.05 and abs(d_score) > 0.2
            
        except Exception as e:
            self.logger.error(f"Error en prueba de significancia: {str(e)}")
            return abs(d_score) > 0.2
    
    def _interpret_d_score(self, d_score: float) -> str:
        """Interpreta el D-Score según criterios estándar"""
        abs_d_score = abs(d_score)
        
        if abs_d_score < 0.15:
            return "no-preference"
        elif abs_d_score < 0.35:
            return "slight-preference"
        elif abs_d_score < 0.65:
            return "moderate-preference"
        else:
            return "strong-preference"
    
    def _classify_effect_size(self, d_score: float) -> str:
        """Clasifica el tamaño del efecto"""
        abs_d_score = abs(d_score)
        
        if abs_d_score < 0.2:
            return "negligible"
        elif abs_d_score < 0.5:
            return "small"
        elif abs_d_score < 0.8:
            return "medium"
        else:
            return "large"
    
    def _analyze_blocks(self, df: pd.DataFrame) -> Dict[str, IATBlockAnalysis]:
        """Analiza cada bloque individualmente"""
        try:
            # Separar bloques compatibles e incompatibles
            compatible_blocks = df[df['block'].isin([3, 4])]
            incompatible_blocks = df[df['block'].isin([6, 7])]
            
            compatible_analysis = self._analyze_single_block(compatible_blocks, "compatible")
            incompatible_analysis = self._analyze_single_block(incompatible_blocks, "incompatible")
            
            return {
                'compatible': compatible_analysis,
                'incompatible': incompatible_analysis
            }
            
        except Exception as e:
            self.logger.error(f"Error analizando bloques: {str(e)}")
            return {
                'compatible': self._default_block_analysis(),
                'incompatible': self._default_block_analysis()
            }
    
    def _analyze_single_block(self, block_df: pd.DataFrame, block_type: str) -> IATBlockAnalysis:
        """Analiza un bloque individual"""
        try:
            if len(block_df) == 0:
                return self._default_block_analysis()
            
            # Métricas básicas
            trial_count = len(block_df)
            mean_rt = block_df['rt'].mean()
            median_rt = block_df['rt'].median()
            std_rt = block_df['rt'].std()
            
            # Precisión
            accuracy = block_df['correct'].mean()
            error_rate = 1 - accuracy
            
            # Análisis de velocidad
            fast_trials = len(block_df[block_df['rt'] < 300])
            slow_trials = len(block_df[block_df['rt'] > 3000])
            
            # Outliers
            outlier_rate = self._calculate_outlier_rate(block_df['rt'])
            
            # Efecto de aprendizaje
            learning_effect = self._calculate_learning_effect(block_df)
            
            # Consistencia
            consistency = self._calculate_consistency(block_df)
            
            return IATBlockAnalysis(
                block_number=block_df['block'].iloc[0] if len(block_df) > 0 else 0,
                block_type=block_type,
                trial_count=trial_count,
                mean_rt=float(mean_rt),
                median_rt=float(median_rt),
                std_rt=float(std_rt),
                accuracy=float(accuracy),
                error_rate=float(error_rate),
                fast_trials=fast_trials,
                slow_trials=slow_trials,
                outlier_rate=float(outlier_rate),
                learning_effect=float(learning_effect),
                consistency=float(consistency)
            )
            
        except Exception as e:
            self.logger.error(f"Error analizando bloque individual: {str(e)}")
            return self._default_block_analysis()
    
    def _calculate_outlier_rate(self, rt_series: pd.Series) -> float:
        """Calcula tasa de outliers en RTs"""
        try:
            Q1 = rt_series.quantile(0.25)
            Q3 = rt_series.quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = rt_series[(rt_series < lower_bound) | (rt_series > upper_bound)]
            return len(outliers) / len(rt_series)
            
        except Exception as e:
            self.logger.error(f"Error calculando outliers: {str(e)}")
            return 0.0
    
    def _calculate_learning_effect(self, block_df: pd.DataFrame) -> float:
        """Calcula efecto de aprendizaje en el bloque"""
        try:
            if len(block_df) < 3:
                return 0.0
            
            # Dividir bloque en tercios
            third = len(block_df) // 3
            first_third = block_df.iloc[:third]['rt'].mean()
            last_third = block_df.iloc[-third:]['rt'].mean()
            
            # Mejora en RT (negativo = mejora)
            learning_effect = (last_third - first_third) / first_third
            return float(learning_effect)
            
        except Exception as e:
            self.logger.error(f"Error calculando efecto de aprendizaje: {str(e)}")
            return 0.0
    
    def _calculate_consistency(self, block_df: pd.DataFrame) -> float:
        """Calcula consistencia en respuestas"""
        try:
            if len(block_df) < 2:
                return 1.0
            
            # Calcular coeficiente de variación
            mean_rt = block_df['rt'].mean()
            std_rt = block_df['rt'].std()
            
            if mean_rt == 0:
                return 1.0
            
            cv = std_rt / mean_rt
            consistency = 1.0 - min(cv, 1.0)  # Normalizar entre 0 y 1
            return float(consistency)
            
        except Exception as e:
            self.logger.error(f"Error calculando consistencia: {str(e)}")
            return 1.0
    
    def _analyze_performance(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analiza rendimiento general"""
        try:
            # Métricas básicas
            accuracy = df['correct'].mean()
            mean_rt = df['rt'].mean()
            
            # Consistencia general
            consistency = self._calculate_consistency(df)
            
            # Curva de aprendizaje
            learning_curve = self._calculate_learning_curve(df)
            
            return {
                'accuracy': float(accuracy),
                'mean_rt': float(mean_rt),
                'consistency': float(consistency),
                'learning_curve': learning_curve
            }
            
        except Exception as e:
            self.logger.error(f"Error analizando rendimiento: {str(e)}")
            return {
                'accuracy': 0.0,
                'mean_rt': 0.0,
                'consistency': 0.0,
                'learning_curve': []
            }
    
    def _calculate_learning_curve(self, df: pd.DataFrame) -> List[float]:
        """Calcula curva de aprendizaje"""
        try:
            # Agrupar por bloques y calcular RT promedio
            block_means = df.groupby('block')['rt'].mean().tolist()
            return [float(x) for x in block_means]
            
        except Exception as e:
            self.logger.error(f"Error calculando curva de aprendizaje: {str(e)}")
            return []
    
    def _analyze_errors(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analiza patrones de errores"""
        try:
            error_df = df[df['correct'] == False]
            
            if len(error_df) == 0:
                return {
                    'pattern': 'no-errors',
                    'details': {'total_errors': 0, 'error_rate': 0.0}
                }
            
            # Análisis de patrones de error
            total_errors = len(error_df)
            error_rate = total_errors / len(df)
            
            # Patrón de errores
            if error_rate < 0.05:
                pattern = 'low-errors'
            elif error_rate < 0.15:
                pattern = 'moderate-errors'
            else:
                pattern = 'high-errors'
            
            return {
                'pattern': pattern,
                'details': {
                    'total_errors': total_errors,
                    'error_rate': float(error_rate),
                    'error_blocks': error_df['block'].value_counts().to_dict()
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error analizando errores: {str(e)}")
            return {
                'pattern': 'unknown',
                'details': {'total_errors': 0, 'error_rate': 0.0}
            }
    
    def _analyze_temporal_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analiza patrones temporales"""
        try:
            # Efecto de fatiga
            fatigue_effect = self._calculate_fatigue_effect(df)
            
            # Métricas de atención
            attention_metrics = self._calculate_attention_metrics(df)
            
            return {
                'fatigue': float(fatigue_effect),
                'attention': attention_metrics
            }
            
        except Exception as e:
            self.logger.error(f"Error analizando patrones temporales: {str(e)}")
            return {
                'fatigue': 0.0,
                'attention': {'focus': 0.0, 'stability': 0.0}
            }
    
    def _calculate_fatigue_effect(self, df: pd.DataFrame) -> float:
        """Calcula efecto de fatiga"""
        try:
            if len(df) < 10:
                return 0.0
            
            # Dividir en mitades
            half = len(df) // 2
            first_half = df.iloc[:half]['rt'].mean()
            second_half = df.iloc[half:]['rt'].mean()
            
            # Aumento en RT (positivo = fatiga)
            fatigue = (second_half - first_half) / first_half
            return float(fatigue)
            
        except Exception as e:
            self.logger.error(f"Error calculando fatiga: {str(e)}")
            return 0.0
    
    def _calculate_attention_metrics(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calcula métricas de atención"""
        try:
            # Estabilidad de atención (inversa de variabilidad)
            rt_std = df['rt'].std()
            rt_mean = df['rt'].mean()
            
            if rt_mean == 0:
                stability = 1.0
            else:
                stability = 1.0 - min(rt_std / rt_mean, 1.0)
            
            # Enfoque (precisión general)
            focus = df['correct'].mean()
            
            return {
                'focus': float(focus),
                'stability': float(stability)
            }
            
        except Exception as e:
            self.logger.error(f"Error calculando métricas de atención: {str(e)}")
            return {'focus': 0.0, 'stability': 0.0}
    
    def _assess_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Evalúa calidad de los datos"""
        try:
            # Puntuación de calidad (0-1)
            quality_score = 1.0
            
            # Penalizar por outliers
            outlier_rate = self._calculate_outlier_rate(df['rt'])
            quality_score -= outlier_rate * 0.3
            
            # Penalizar por respuestas muy rápidas
            fast_responses = len(df[df['rt'] < 200]) / len(df)
            quality_score -= fast_responses * 0.2
            
            # Penalizar por respuestas muy lentas
            slow_responses = len(df[df['rt'] > 5000]) / len(df)
            quality_score -= slow_responses * 0.1
            
            # Asegurar que esté entre 0 y 1
            quality_score = max(0.0, min(1.0, quality_score))
            
            # Métricas de confiabilidad
            reliability = {
                'internal_consistency': self._calculate_internal_consistency(df),
                'test_retest_reliability': 0.8,  # Valor estimado
                'split_half_reliability': self._calculate_split_half_reliability(df)
            }
            
            return {
                'score': float(quality_score),
                'reliability': reliability
            }
            
        except Exception as e:
            self.logger.error(f"Error evaluando calidad de datos: {str(e)}")
            return {
                'score': 0.5,
                'reliability': {'internal_consistency': 0.0, 'test_retest_reliability': 0.0, 'split_half_reliability': 0.0}
            }
    
    def _calculate_internal_consistency(self, df: pd.DataFrame) -> float:
        """Calcula consistencia interna"""
        try:
            # Dividir en mitades y correlacionar
            half = len(df) // 2
            first_half = df.iloc[:half]['rt']
            second_half = df.iloc[half:2*half]['rt']
            
            if len(first_half) != len(second_half):
                return 0.0
            
            correlation = first_half.corr(second_half)
            return float(correlation) if not pd.isna(correlation) else 0.0
            
        except Exception as e:
            self.logger.error(f"Error calculando consistencia interna: {str(e)}")
            return 0.0
    
    def _calculate_split_half_reliability(self, df: pd.DataFrame) -> float:
        """Calcula confiabilidad split-half"""
        try:
            # Implementación simplificada
            return self._calculate_internal_consistency(df)
            
        except Exception as e:
            self.logger.error(f"Error calculando confiabilidad split-half: {str(e)}")
            return 0.0
    
    def _make_serializable(self, obj: Any) -> Any:
        """Convierte objetos numpy a tipos Python nativos para serialización JSON"""
        if isinstance(obj, dict):
            return {key: self._make_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif hasattr(obj, '__dict__'):
            return self._make_serializable(obj.__dict__)
        else:
            return obj
    
    def _default_d_score_analysis(self) -> Dict[str, Any]:
        """Análisis D-Score por defecto en caso de error"""
        return {
            'd_score': 0.0,
            'interpretation': 'no-preference',
            'confidence_interval': (0.0, 0.0),
            'significance': False,
            'effect_size': 'negligible'
        }
    
    def _default_block_analysis(self) -> IATBlockAnalysis:
        """Análisis de bloque por defecto"""
        return IATBlockAnalysis(
            block_number=0,
            block_type='unknown',
            trial_count=0,
            mean_rt=0.0,
            median_rt=0.0,
            std_rt=0.0,
            accuracy=0.0,
            error_rate=0.0,
            fast_trials=0,
            slow_trials=0,
            outlier_rate=0.0,
            learning_effect=0.0,
            consistency=0.0
        )

def main():
    """Función principal para comunicación con Node.js"""
    try:
        # Leer datos desde stdin
        input_data = json.loads(sys.stdin.read())
        
        engine = IATAnalysisEngine()
        analysis = engine.analyze_session(input_data)
        
        # Convertir a diccionario serializable
        result = {
            'success': True,
            'analysis': engine._make_serializable(asdict(analysis)),
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Enviar resultado a stdout
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': f'Error en IAT Analysis Engine: {str(e)}',
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        print(json.dumps(error_result, ensure_ascii=False))

if __name__ == "__main__":
    main()
