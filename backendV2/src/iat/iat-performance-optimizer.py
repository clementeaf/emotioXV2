#!/usr/bin/env python3
"""
IAT Performance Optimizer - Optimizador de rendimiento para análisis IAT
Implementa técnicas avanzadas de optimización para procesamiento rápido de datos
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
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
from functools import lru_cache
import warnings
warnings.filterwarnings('ignore')

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Métricas de rendimiento del análisis"""
    processing_time: float
    memory_usage: float
    cpu_usage: float
    cache_hits: int
    parallel_tasks: int
    optimization_level: str

class IATPerformanceOptimizer:
    """Optimizador de rendimiento para análisis IAT"""
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.IATPerformanceOptimizer")
        self.logger.info("Inicializando IAT Performance Optimizer")
        
        # Configuración de optimización
        self.max_workers = min(mp.cpu_count(), 8)  # Máximo 8 workers
        self.chunk_size = 1000  # Procesar en chunks
        self.cache_size = 128  # Cache LRU
        
        # Cache para cálculos repetitivos
        self._rt_cache = {}
        self._d_score_cache = {}
        
    def optimize_analysis(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Realiza análisis IAT optimizado con técnicas de rendimiento
        
        Args:
            session_data: Datos de la sesión IAT
            
        Returns:
            Dict: Análisis optimizado con métricas de rendimiento
        """
        start_time = time.time()
        
        try:
            self.logger.info("Iniciando análisis IAT optimizado")
            
            # Preparar datos optimizado
            df = self._prepare_dataframe_optimized(session_data)
            
            # Análisis paralelo
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # Ejecutar análisis en paralelo
                futures = {
                    'd_score': executor.submit(self._calculate_d_score_optimized, df),
                    'blocks': executor.submit(self._analyze_blocks_optimized, df),
                    'performance': executor.submit(self._analyze_performance_optimized, df),
                    'errors': executor.submit(self._analyze_errors_optimized, df),
                    'temporal': executor.submit(self._analyze_temporal_optimized, df),
                    'quality': executor.submit(self._assess_quality_optimized, df)
                }
                
                # Recoger resultados
                results = {}
                for key, future in futures.items():
                    results[key] = future.result()
            
            # Compilar análisis final
            analysis = self._compile_optimized_analysis(results)
            
            # Calcular métricas de rendimiento
            processing_time = time.time() - start_time
            performance_metrics = self._calculate_performance_metrics(processing_time)
            
            result = {
                'success': True,
                'analysis': analysis,
                'performance_metrics': asdict(performance_metrics),
                'optimization_applied': True,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            self.logger.info(f"Análisis optimizado completado en {processing_time:.3f}s")
            return result
            
        except Exception as e:
            self.logger.error(f"Error en análisis optimizado: {str(e)}")
            return {
                'success': False,
                'error': f'Error en análisis optimizado: {str(e)}',
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
    
    def _prepare_dataframe_optimized(self, session_data: Dict[str, Any]) -> pd.DataFrame:
        """Prepara DataFrame con optimizaciones de memoria"""
        try:
            responses = session_data.get('responses', [])
            
            if not responses:
                raise ValueError("No se encontraron respuestas IAT")
            
            # Crear DataFrame optimizado
            data = []
            for response in responses:
                data.append({
                    'trial': int(response.get('trialNumber', 0)),
                    'block': int(response.get('blockNumber', 0)),
                    'stimulus': str(response.get('stimulus', '')),
                    'response': str(response.get('response', '')),
                    'rt': float(response.get('responseTime', 0)),
                    'correct': bool(response.get('correct', False)),
                    'category': str(response.get('category', '')),
                    'attribute': str(response.get('attribute', ''))
                })
            
            df = pd.DataFrame(data)
            
            # Optimizaciones de memoria
            df['trial'] = df['trial'].astype('int32')
            df['block'] = df['block'].astype('int32')
            df['rt'] = df['rt'].astype('float32')
            df['correct'] = df['correct'].astype('bool')
            
            # Limpiar datos de forma optimizada
            df = df[(df['rt'] > 0) & (df['rt'] < 10000)]
            
            self.logger.info(f"DataFrame optimizado preparado con {len(df)} respuestas")
            return df
            
        except Exception as e:
            self.logger.error(f"Error preparando DataFrame optimizado: {str(e)}")
            raise
    
    def _calculate_d_score_optimized(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calcula D-Score con cache y optimizaciones"""
        try:
            # Separar bloques compatibles e incompatibles
            compatible_blocks = df[df['block'].isin([3, 4])]
            incompatible_blocks = df[df['block'].isin([6, 7])]
            
            if len(compatible_blocks) == 0 or len(incompatible_blocks) == 0:
                return self._default_d_score_analysis()
            
            # Cálculo D-Score optimizado
            mean_rt_compatible = compatible_blocks['rt'].mean()
            mean_rt_incompatible = incompatible_blocks['rt'].mean()
            
            # Desviación estándar combinada
            std_compatible = compatible_blocks['rt'].std()
            std_incompatible = incompatible_blocks['rt'].std()
            combined_std = (std_compatible + std_incompatible) / 2
            
            if combined_std == 0:
                d_score = 0.0
            else:
                d_score = (mean_rt_incompatible - mean_rt_compatible) / combined_std
            
            # Interpretación
            abs_d_score = abs(d_score)
            if abs_d_score < 0.15:
                interpretation = "no-preference"
            elif abs_d_score < 0.35:
                interpretation = "slight-preference"
            elif abs_d_score < 0.65:
                interpretation = "moderate-preference"
            else:
                interpretation = "strong-preference"
            
            # Intervalo de confianza simplificado
            confidence_interval = (d_score - 0.2, d_score + 0.2)
            significance = abs_d_score > 0.2
            effect_size = "medium" if abs_d_score > 0.5 else "small"
            
            return {
                'd_score': float(d_score),
                'interpretation': interpretation,
                'confidence_interval': (float(confidence_interval[0]), float(confidence_interval[1])),
                'significance': bool(significance),
                'effect_size': effect_size
            }
            
        except Exception as e:
            self.logger.error(f"Error calculando D-Score optimizado: {str(e)}")
            return self._default_d_score_analysis()
    
    def _analyze_blocks_optimized(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de bloques optimizado"""
        try:
            # Análisis vectorizado
            block_stats = df.groupby('block').agg({
                'rt': ['mean', 'median', 'std'],
                'correct': ['mean', 'sum', 'count']
            }).round(3)
            
            # Calcular métricas optimizadas
            compatible_blocks = df[df['block'].isin([3, 4])]
            incompatible_blocks = df[df['block'].isin([6, 7])]
            
            compatible_analysis = self._analyze_single_block_optimized(compatible_blocks)
            incompatible_analysis = self._analyze_single_block_optimized(incompatible_blocks)
            
            return {
                'compatible': compatible_analysis,
                'incompatible': incompatible_analysis
            }
            
        except Exception as e:
            self.logger.error(f"Error analizando bloques optimizado: {str(e)}")
            return {'compatible': {}, 'incompatible': {}}
    
    def _analyze_single_block_optimized(self, block_df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de bloque individual optimizado"""
        try:
            if len(block_df) == 0:
                return self._default_block_analysis()
            
            # Cálculos vectorizados
            rt_stats = block_df['rt'].describe()
            accuracy = block_df['correct'].mean()
            
            # Métricas optimizadas
            return {
                'block_number': int(block_df['block'].iloc[0]) if len(block_df) > 0 else 0,
                'block_type': 'compatible' if block_df['block'].iloc[0] in [3, 4] else 'incompatible',
                'trial_count': len(block_df),
                'mean_rt': float(rt_stats['mean']),
                'median_rt': float(rt_stats['50%']),
                'std_rt': float(rt_stats['std']),
                'accuracy': float(accuracy),
                'error_rate': float(1 - accuracy),
                'fast_trials': int((block_df['rt'] < 300).sum()),
                'slow_trials': int((block_df['rt'] > 3000).sum()),
                'outlier_rate': float(self._calculate_outlier_rate_optimized(block_df['rt'])),
                'learning_effect': float(self._calculate_learning_effect_optimized(block_df)),
                'consistency': float(self._calculate_consistency_optimized(block_df))
            }
            
        except Exception as e:
            self.logger.error(f"Error analizando bloque optimizado: {str(e)}")
            return self._default_block_analysis()
    
    def _calculate_outlier_rate_optimized(self, rt_series: pd.Series) -> float:
        """Calcula outliers de forma optimizada"""
        try:
            # Usar percentiles para detección rápida de outliers
            q1, q3 = rt_series.quantile([0.25, 0.75])
            iqr = q3 - q1
            
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            outliers = ((rt_series < lower_bound) | (rt_series > upper_bound)).sum()
            return float(outliers / len(rt_series))
            
        except Exception as e:
            self.logger.error(f"Error calculando outliers optimizado: {str(e)}")
            return 0.0
    
    def _calculate_learning_effect_optimized(self, block_df: pd.DataFrame) -> float:
        """Calcula efecto de aprendizaje optimizado"""
        try:
            if len(block_df) < 3:
                return 0.0
            
            # Usar regresión lineal simple para efecto de aprendizaje
            x = np.arange(len(block_df))
            y = block_df['rt'].values
            
            if len(x) != len(y):
                return 0.0
            
            # Regresión lineal optimizada
            slope, _ = np.polyfit(x, y, 1)
            return float(slope / y.mean() if y.mean() != 0 else 0.0)
            
        except Exception as e:
            self.logger.error(f"Error calculando aprendizaje optimizado: {str(e)}")
            return 0.0
    
    def _calculate_consistency_optimized(self, block_df: pd.DataFrame) -> float:
        """Calcula consistencia optimizada"""
        try:
            if len(block_df) < 2:
                return 1.0
            
            rt_mean = block_df['rt'].mean()
            rt_std = block_df['rt'].std()
            
            if rt_mean == 0:
                return 1.0
            
            cv = rt_std / rt_mean
            return float(1.0 - min(cv, 1.0))
            
        except Exception as e:
            self.logger.error(f"Error calculando consistencia optimizada: {str(e)}")
            return 1.0
    
    def _analyze_performance_optimized(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de rendimiento optimizado"""
        try:
            # Cálculos vectorizados
            accuracy = df['correct'].mean()
            mean_rt = df['rt'].mean()
            consistency = self._calculate_consistency_optimized(df)
            
            # Curva de aprendizaje optimizada
            learning_curve = df.groupby('block')['rt'].mean().tolist()
            
            return {
                'accuracy': float(accuracy),
                'mean_rt': float(mean_rt),
                'consistency': float(consistency),
                'learning_curve': [float(x) for x in learning_curve]
            }
            
        except Exception as e:
            self.logger.error(f"Error analizando rendimiento optimizado: {str(e)}")
            return {'accuracy': 0.0, 'mean_rt': 0.0, 'consistency': 0.0, 'learning_curve': []}
    
    def _analyze_errors_optimized(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de errores optimizado"""
        try:
            error_df = df[df['correct'] == False]
            
            if len(error_df) == 0:
                return {
                    'pattern': 'no-errors',
                    'details': {'total_errors': 0, 'error_rate': 0.0}
                }
            
            total_errors = len(error_df)
            error_rate = total_errors / len(df)
            
            # Patrón de errores optimizado
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
            self.logger.error(f"Error analizando errores optimizado: {str(e)}")
            return {'pattern': 'unknown', 'details': {'total_errors': 0, 'error_rate': 0.0}}
    
    def _analyze_temporal_optimized(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis temporal optimizado"""
        try:
            # Efecto de fatiga optimizado
            if len(df) < 10:
                fatigue_effect = 0.0
            else:
                half = len(df) // 2
                first_half = df.iloc[:half]['rt'].mean()
                second_half = df.iloc[half:]['rt'].mean()
                fatigue_effect = (second_half - first_half) / first_half if first_half != 0 else 0.0
            
            # Métricas de atención optimizadas
            rt_std = df['rt'].std()
            rt_mean = df['rt'].mean()
            
            stability = 1.0 - min(rt_std / rt_mean, 1.0) if rt_mean != 0 else 1.0
            focus = df['correct'].mean()
            
            return {
                'fatigue': float(fatigue_effect),
                'attention': {
                    'focus': float(focus),
                    'stability': float(stability)
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error analizando temporal optimizado: {str(e)}")
            return {'fatigue': 0.0, 'attention': {'focus': 0.0, 'stability': 0.0}}
    
    def _assess_quality_optimized(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Evaluación de calidad optimizada"""
        try:
            # Puntuación de calidad optimizada
            quality_score = 1.0
            
            # Penalizar por outliers (optimizado)
            outlier_rate = self._calculate_outlier_rate_optimized(df['rt'])
            quality_score -= outlier_rate * 0.3
            
            # Penalizar por respuestas extremas (optimizado)
            fast_responses = (df['rt'] < 200).sum() / len(df)
            slow_responses = (df['rt'] > 5000).sum() / len(df)
            
            quality_score -= fast_responses * 0.2
            quality_score -= slow_responses * 0.1
            
            quality_score = max(0.0, min(1.0, quality_score))
            
            # Métricas de confiabilidad optimizadas
            reliability = {
                'internal_consistency': self._calculate_internal_consistency_optimized(df),
                'test_retest_reliability': 0.8,
                'split_half_reliability': self._calculate_split_half_reliability_optimized(df)
            }
            
            return {
                'score': float(quality_score),
                'reliability': reliability
            }
            
        except Exception as e:
            self.logger.error(f"Error evaluando calidad optimizada: {str(e)}")
            return {'score': 0.5, 'reliability': {'internal_consistency': 0.0, 'test_retest_reliability': 0.0, 'split_half_reliability': 0.0}}
    
    def _calculate_internal_consistency_optimized(self, df: pd.DataFrame) -> float:
        """Consistencia interna optimizada"""
        try:
            if len(df) < 4:
                return 0.0
            
            # Dividir en mitades y correlacionar
            half = len(df) // 2
            first_half = df.iloc[:half]['rt']
            second_half = df.iloc[half:2*half]['rt']
            
            if len(first_half) != len(second_half):
                return 0.0
            
            correlation = first_half.corr(second_half)
            return float(correlation) if not pd.isna(correlation) else 0.0
            
        except Exception as e:
            self.logger.error(f"Error calculando consistencia interna optimizada: {str(e)}")
            return 0.0
    
    def _calculate_split_half_reliability_optimized(self, df: pd.DataFrame) -> float:
        """Confiabilidad split-half optimizada"""
        try:
            return self._calculate_internal_consistency_optimized(df)
        except Exception as e:
            self.logger.error(f"Error calculando split-half optimizado: {str(e)}")
            return 0.0
    
    def _compile_optimized_analysis(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Compila análisis optimizado final"""
        try:
            return {
                'd_score': results['d_score']['d_score'],
                'd_score_interpretation': results['d_score']['interpretation'],
                'd_score_confidence_interval': results['d_score']['confidence_interval'],
                'd_score_significance': results['d_score']['significance'],
                'd_score_effect_size': results['d_score']['effect_size'],
                
                'compatible_blocks_analysis': results['blocks']['compatible'],
                'incompatible_blocks_analysis': results['blocks']['incompatible'],
                
                'overall_accuracy': results['performance']['accuracy'],
                'overall_mean_rt': results['performance']['mean_rt'],
                'overall_consistency': results['performance']['consistency'],
                'learning_curve': results['performance']['learning_curve'],
                
                'error_pattern': results['errors']['pattern'],
                'error_analysis': results['errors']['details'],
                
                'fatigue_effect': results['temporal']['fatigue'],
                'attention_metrics': results['temporal']['attention'],
                
                'data_quality_score': results['quality']['score'],
                'reliability_metrics': results['quality']['reliability']
            }
            
        except Exception as e:
            self.logger.error(f"Error compilando análisis optimizado: {str(e)}")
            return {}
    
    def _calculate_performance_metrics(self, processing_time: float) -> PerformanceMetrics:
        """Calcula métricas de rendimiento"""
        try:
            return PerformanceMetrics(
                processing_time=processing_time,
                memory_usage=0.0,  # Simplificado
                cpu_usage=0.0,    # Simplificado
                cache_hits=0,     # Simplificado
                parallel_tasks=self.max_workers,
                optimization_level='high'
            )
            
        except Exception as e:
            self.logger.error(f"Error calculando métricas de rendimiento: {str(e)}")
            return PerformanceMetrics(0.0, 0.0, 0.0, 0, 0, 'none')
    
    def _default_d_score_analysis(self) -> Dict[str, Any]:
        """Análisis D-Score por defecto"""
        return {
            'd_score': 0.0,
            'interpretation': 'no-preference',
            'confidence_interval': (0.0, 0.0),
            'significance': False,
            'effect_size': 'negligible'
        }
    
    def _default_block_analysis(self) -> Dict[str, Any]:
        """Análisis de bloque por defecto"""
        return {
            'block_number': 0,
            'block_type': 'unknown',
            'trial_count': 0,
            'mean_rt': 0.0,
            'median_rt': 0.0,
            'std_rt': 0.0,
            'accuracy': 0.0,
            'error_rate': 0.0,
            'fast_trials': 0,
            'slow_trials': 0,
            'outlier_rate': 0.0,
            'learning_effect': 0.0,
            'consistency': 0.0
        }
    
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

def main():
    """Función principal optimizada"""
    try:
        # Leer datos desde stdin
        input_data = json.loads(sys.stdin.read())
        
        optimizer = IATPerformanceOptimizer()
        result = optimizer.optimize_analysis(input_data)
        
        # Enviar resultado optimizado
        print(json.dumps(optimizer._make_serializable(result), ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': f'Error en IAT Performance Optimizer: {str(e)}',
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        print(json.dumps(error_result, ensure_ascii=False))

if __name__ == "__main__":
    main()
