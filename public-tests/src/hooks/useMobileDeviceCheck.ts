import { useMemo } from 'react';
import { useParticipantStore } from '../stores/participantStore';

interface MobileDeviceCheckResult {
    deviceType: 'mobile' | 'tablet' | 'desktop' | null;
    allowMobile: boolean;
    configFound: boolean;
    shouldBlock: boolean;
    isMobileOrTablet: boolean;
}

/**
 * Hook personalizado para manejar la detección y configuración de dispositivos móviles
 */
export const useMobileDeviceCheck = (
    eyeTrackingConfig: any,
    isFlowLoading: boolean
): MobileDeviceCheckResult => {
    const deviceType = useParticipantStore(state => state.deviceType);

    // Función para obtener la configuración de dispositivos móviles
    const mobileConfig = useMemo(() => {
        if (!eyeTrackingConfig) {
            return { allowMobile: true, configFound: false };
        }

        // Buscar en diferentes ubicaciones posibles de la configuración
        const possiblePaths = [
            (eyeTrackingConfig as any).linkConfig?.allowMobile,
            (eyeTrackingConfig as any).linkConfig?.allowMobileDevices,
            (eyeTrackingConfig as any).allowMobile,
            (eyeTrackingConfig as any).allowMobileDevices
        ];

        // Encontrar el primer valor definido (no undefined)
        const allowMobile = possiblePaths.find(value => value !== undefined);

        return {
            allowMobile: allowMobile !== undefined ? Boolean(allowMobile) : true,
            configFound: allowMobile !== undefined
        };
    }, [eyeTrackingConfig]);

    // Determinar si el usuario está en móvil o tablet
    const isMobileOrTablet = useMemo(() => {
        return deviceType === 'mobile' || deviceType === 'tablet';
    }, [deviceType]);

    // Determinar si se debe bloquear el acceso
    const shouldBlock = useMemo(() => {
        return !isFlowLoading && isMobileOrTablet && !mobileConfig.allowMobile;
    }, [isFlowLoading, isMobileOrTablet, mobileConfig.allowMobile]);

    return {
        deviceType,
        allowMobile: mobileConfig.allowMobile,
        configFound: mobileConfig.configFound,
        shouldBlock,
        isMobileOrTablet
    };
};
