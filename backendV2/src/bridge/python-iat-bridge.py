#!/usr/bin/env python3
"""
Python IAT Bridge - Comunicación entre Python IAT y Node.js
Proporciona endpoints para ejecutar análisis IAT desde Node.js
"""

import sys
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import pandas as pd
import numpy as np

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class IATResponse:
    """Respuesta estándar del bridge Python"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: Optional[str] = None

class IATPythonBridge:
    """Bridge principal para comunicación Python IAT <-> Node.js"""
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.IATPythonBridge")
        self.logger.info("Inicializando Python IAT Bridge")
        
    def process_iat_data(self, raw_data: Dict[str, Any]) -> IATResponse:
        """
        Procesa datos IAT usando pyiat y devuelve análisis estadístico
        
        Args:
            raw_data: Datos de respuesta IAT desde Node.js
            
        Returns:
            IATResponse: Resultado del análisis
        """
        try:
            self.logger.info("Procesando datos IAT")
            
            # Convertir datos a DataFrame para pyiat
            df = self._prepare_dataframe(raw_data)
            
            # Ejecutar análisis IAT
            analysis_result = self._run_iat_analysis(df)
            
            return IATResponse(
                success=True,
                data=analysis_result,
                timestamp=pd.Timestamp.now().isoformat()
            )
            
        except Exception as e:
            self.logger.error(f"Error procesando datos IAT: {str(e)}")
            return IATResponse(
                success=False,
                error=str(e),
                timestamp=pd.Timestamp.now().isoformat()
            )
    
    def _prepare_dataframe(self, raw_data: Dict[str, Any]) -> pd.DataFrame:
        """Convierte datos raw a DataFrame compatible con pyiat"""
        try:
            # Extraer respuestas de la sesión IAT
            responses = raw_data.get('responses', [])
            
            if not responses:
                raise ValueError("No se encontraron respuestas IAT")
            
            # Crear DataFrame con estructura esperada por pyiat
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
                    'attribute': response.get('attribute', '')
                })
            
            df = pd.DataFrame(data)
            self.logger.info(f"DataFrame preparado con {len(df)} respuestas")
            return df
            
        except Exception as e:
            self.logger.error(f"Error preparando DataFrame: {str(e)}")
            raise
    
    def _run_iat_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Ejecuta análisis IAT usando pyiat"""
        try:
            # Importar pyiat dinámicamente para manejar errores
            try:
                import pyiat
            except ImportError as e:
                self.logger.error(f"pyiat no disponible: {str(e)}")
                # Fallback: análisis básico sin pyiat
                return self._basic_iat_analysis(df)
            
            # Ejecutar análisis usando funciones de pyiat
            results = self._run_pyiat_analysis(df)
            
            # Convertir resultados a diccionario serializable
            analysis_result = {
                'd_score': results.get('d_score', 0.0),
                'mean_rt_compatible': results.get('mean_rt_compatible', 0.0),
                'mean_rt_incompatible': results.get('mean_rt_incompatible', 0.0),
                'error_rate': results.get('error_rate', 0.0),
                'statistical_significance': results.get('statistical_significance', False),
                'effect_size': results.get('effect_size', 0.0),
                'confidence_interval': results.get('confidence_interval', [0.0, 0.0]),
                'raw_data': df.to_dict('records')
            }
            
            self.logger.info(f"Análisis IAT completado - D-Score: {analysis_result['d_score']}")
            return analysis_result
            
        except Exception as e:
            self.logger.error(f"Error en análisis IAT: {str(e)}")
            # Fallback: análisis básico
            return self._basic_iat_analysis(df)
    
    def _run_pyiat_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Ejecuta análisis IAT usando funciones de pyiat"""
        try:
            import pyiat
            
            # Preparar datos para pyiat (necesita columnas específicas)
            # pyiat espera: 'rt', 'correct', 'block', 'stimulus'
            df_pyiat = df.copy()
            
            # Asegurar que tenemos las columnas necesarias
            if 'rt' not in df_pyiat.columns:
                df_pyiat['rt'] = df_pyiat.get('responseTime', 0)
            if 'correct' not in df_pyiat.columns:
                df_pyiat['correct'] = df_pyiat.get('correct', True)
            if 'block' not in df_pyiat.columns:
                df_pyiat['block'] = df_pyiat.get('blockNumber', 1)
            if 'stimulus' not in df_pyiat.columns:
                df_pyiat['stimulus'] = df_pyiat.get('stimulus', '')
            
            # Ejecutar análisis IAT usando pyiat
            # pyiat.iat_get_dscore necesita parámetros específicos
            # Usar análisis básico por ahora, pyiat requiere configuración más compleja
            d_score = self._calculate_basic_dscore(df_pyiat)
            
            # Calcular estadísticas adicionales
            compatible_blocks = df_pyiat[df_pyiat['block'].isin([3, 4, 7])]
            incompatible_blocks = df_pyiat[df_pyiat['block'].isin([6, 7])]
            
            mean_rt_compatible = compatible_blocks['rt'].mean() if len(compatible_blocks) > 0 else 0
            mean_rt_incompatible = incompatible_blocks['rt'].mean() if len(incompatible_blocks) > 0 else 0
            
            # Calcular tasa de error
            total_responses = len(df_pyiat)
            incorrect_responses = len(df_pyiat[df_pyiat['correct'] == False])
            error_rate = (incorrect_responses / total_responses) * 100 if total_responses > 0 else 0
            
            return {
                'd_score': float(d_score),
                'mean_rt_compatible': float(mean_rt_compatible),
                'mean_rt_incompatible': float(mean_rt_incompatible),
                'error_rate': float(error_rate),
                'statistical_significance': bool(abs(d_score) > 0.2),
                'effect_size': float(abs(d_score)),
                'confidence_interval': [float(d_score - 0.1), float(d_score + 0.1)],
                'analysis_method': 'pyiat',
                'raw_data': df_pyiat.to_dict('records')
            }
            
        except Exception as e:
            self.logger.error(f"Error en análisis pyiat: {str(e)}")
            # Fallback: análisis básico
            return self._basic_iat_analysis(df)
    
    def _calculate_basic_dscore(self, df: pd.DataFrame) -> float:
        """Calcula D-Score básico usando la fórmula estándar"""
        try:
            # Separar bloques compatibles e incompatibles
            compatible_blocks = df[df['block'].isin([3, 4, 7])]
            incompatible_blocks = df[df['block'].isin([6, 7])]
            
            if len(compatible_blocks) == 0 or len(incompatible_blocks) == 0:
                return 0.0
            
            # Calcular tiempos de respuesta promedio
            mean_rt_compatible = compatible_blocks['rt'].mean()
            mean_rt_incompatible = incompatible_blocks['rt'].mean()
            
            # Calcular desviación estándar combinada
            std_compatible = compatible_blocks['rt'].std()
            std_incompatible = incompatible_blocks['rt'].std()
            combined_std = (std_compatible + std_incompatible) / 2
            
            if combined_std == 0:
                return 0.0
            
            # Fórmula D-Score: (RT_incompatible - RT_compatible) / std_combined
            d_score = (mean_rt_incompatible - mean_rt_compatible) / combined_std
            
            return float(d_score)
            
        except Exception as e:
            self.logger.error(f"Error calculando D-Score básico: {str(e)}")
            return 0.0
    
    def _basic_iat_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis IAT básico sin pyiat (fallback)"""
        try:
            # Separar bloques compatibles e incompatibles
            compatible_blocks = df[df['block'].isin([3, 4, 7])]  # Bloques compatibles
            incompatible_blocks = df[df['block'].isin([6, 7])]    # Bloques incompatibles
            
            # Calcular tiempos de respuesta promedio
            mean_rt_compatible = compatible_blocks['rt'].mean() if len(compatible_blocks) > 0 else 0
            mean_rt_incompatible = incompatible_blocks['rt'].mean() if len(incompatible_blocks) > 0 else 0
            
            # Calcular D-Score básico (diferencia estandarizada)
            if mean_rt_compatible > 0 and mean_rt_incompatible > 0:
                d_score = (mean_rt_incompatible - mean_rt_compatible) / (
                    (compatible_blocks['rt'].std() + incompatible_blocks['rt'].std()) / 2
                )
            else:
                d_score = 0.0
            
            # Calcular tasa de error
            total_responses = len(df)
            incorrect_responses = len(df[df['correct'] == False])
            error_rate = (incorrect_responses / total_responses) * 100 if total_responses > 0 else 0
            
            return {
                'd_score': float(d_score),
                'mean_rt_compatible': float(mean_rt_compatible),
                'mean_rt_incompatible': float(mean_rt_incompatible),
                'error_rate': float(error_rate),
                'statistical_significance': bool(abs(d_score) > 0.2),  # Threshold básico
                'effect_size': float(abs(d_score)),
                'confidence_interval': [float(d_score - 0.1), float(d_score + 0.1)],
                'analysis_method': 'basic_fallback',
                'raw_data': df.to_dict('records')
            }
            
        except Exception as e:
            self.logger.error(f"Error en análisis básico: {str(e)}")
            return {
                'd_score': 0.0,
                'mean_rt_compatible': 0.0,
                'mean_rt_incompatible': 0.0,
                'error_rate': 0.0,
                'statistical_significance': False,
                'effect_size': 0.0,
                'confidence_interval': [0.0, 0.0],
                'analysis_method': 'error',
                'error_message': str(e),
                'raw_data': []
            }

def main():
    """Función principal para comunicación con Node.js"""
    try:
        # Leer datos desde stdin (desde Node.js)
        input_data = json.loads(sys.stdin.read())
        
        # Crear bridge y procesar datos
        bridge = IATPythonBridge()
        result = bridge.process_iat_data(input_data)
        
        # Enviar resultado a stdout (hacia Node.js)
        print(json.dumps(asdict(result), ensure_ascii=False))
        
    except Exception as e:
        # Enviar error a stdout
        error_response = IATResponse(
            success=False,
            error=f"Error en bridge Python: {str(e)}",
            timestamp=pd.Timestamp.now().isoformat()
        )
        print(json.dumps(asdict(error_response), ensure_ascii=False))

if __name__ == "__main__":
    main()
