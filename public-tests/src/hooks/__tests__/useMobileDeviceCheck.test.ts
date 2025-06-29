import { useParticipantStore } from '../../stores/participantStore';
import { useMobileDeviceCheck } from '../useMobileDeviceCheck';

// Mock del store
jest.mock('../../stores/participantStore', () => ({
  useParticipantStore: jest.fn()
}));

const mockUseParticipantStore = useParticipantStore as jest.MockedFunction<typeof useParticipantStore>;

describe('useMobileDeviceCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuración de dispositivos móviles', () => {
    it('debe permitir móviles cuando no hay configuración', () => {
      mockUseParticipantStore.mockReturnValue('desktop');

      const result = useMobileDeviceCheck(null, false);

      expect(result.allowMobile).toBe(true);
      expect(result.configFound).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('debe permitir móviles cuando allowMobile es true', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: true };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(true);
      expect(result.configFound).toBe(true);
      expect(result.shouldBlock).toBe(false);
    });

    it('debe bloquear móviles cuando allowMobile es false', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: false };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(false);
      expect(result.configFound).toBe(true);
      expect(result.shouldBlock).toBe(true);
    });

    it('debe permitir desktop incluso cuando allowMobile es false', () => {
      mockUseParticipantStore.mockReturnValue('desktop');

      const config = { allowMobile: false };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(false);
      expect(result.configFound).toBe(true);
      expect(result.shouldBlock).toBe(false);
    });
  });

  describe('Diferentes formatos de configuración', () => {
    it('debe leer allowMobile desde linkConfig', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = {
        linkConfig: { allowMobile: false }
      };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(false);
      expect(result.configFound).toBe(true);
    });

    it('debe leer allowMobileDevices desde linkConfig', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = {
        linkConfig: { allowMobileDevices: false }
      };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(false);
      expect(result.configFound).toBe(true);
    });

    it('debe leer allowMobile desde la raíz del config', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: false };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(false);
      expect(result.configFound).toBe(true);
    });

    it('debe leer allowMobileDevices desde la raíz del config', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobileDevices: false };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(false);
      expect(result.configFound).toBe(true);
    });

    it('debe priorizar linkConfig.allowMobile sobre otros valores', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = {
        linkConfig: { allowMobile: false },
        allowMobile: true,
        allowMobileDevices: true
      };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(false);
      expect(result.configFound).toBe(true);
    });
  });

  describe('Detección de tipo de dispositivo', () => {
    it('debe detectar móvil correctamente', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const result = useMobileDeviceCheck({ allowMobile: false }, false);

      expect(result.deviceType).toBe('mobile');
      expect(result.isMobileOrTablet).toBe(true);
    });

    it('debe detectar tablet correctamente', () => {
      mockUseParticipantStore.mockReturnValue('tablet');

      const result = useMobileDeviceCheck({ allowMobile: false }, false);

      expect(result.deviceType).toBe('tablet');
      expect(result.isMobileOrTablet).toBe(true);
    });

    it('debe detectar desktop correctamente', () => {
      mockUseParticipantStore.mockReturnValue('desktop');

      const result = useMobileDeviceCheck({ allowMobile: false }, false);

      expect(result.deviceType).toBe('desktop');
      expect(result.isMobileOrTablet).toBe(false);
    });
  });

  describe('Estado de carga', () => {
    it('no debe bloquear durante la carga', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: false };
      const result = useMobileDeviceCheck(config, true);

      expect(result.shouldBlock).toBe(false);
    });

    it('debe bloquear después de la carga si corresponde', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: false };
      const result = useMobileDeviceCheck(config, false);

      expect(result.shouldBlock).toBe(true);
    });
  });

  describe('Casos edge', () => {
    it('debe manejar configuración undefined', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: undefined };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(true);
      expect(result.configFound).toBe(false);
    });

    it('debe manejar configuración null', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: null };
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(true);
      expect(result.configFound).toBe(false);
    });

    it('debe manejar configuración vacía', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = {};
      const result = useMobileDeviceCheck(config, false);

      expect(result.allowMobile).toBe(true);
      expect(result.configFound).toBe(false);
    });

    it('debe manejar deviceType null', () => {
      mockUseParticipantStore.mockReturnValue(null);

      const config = { allowMobile: false };
      const result = useMobileDeviceCheck(config, false);

      expect(result.deviceType).toBe(null);
      expect(result.isMobileOrTablet).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });
  });

  describe('Valores de retorno', () => {
    it('debe retornar todos los valores esperados', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: false };
      const result = useMobileDeviceCheck(config, false);

      expect(result).toHaveProperty('deviceType');
      expect(result).toHaveProperty('allowMobile');
      expect(result).toHaveProperty('configFound');
      expect(result).toHaveProperty('shouldBlock');
      expect(result).toHaveProperty('isMobileOrTablet');
    });

    it('debe tener tipos correctos para todos los valores', () => {
      mockUseParticipantStore.mockReturnValue('mobile');

      const config = { allowMobile: false };
      const result = useMobileDeviceCheck(config, false);

      expect(typeof result.deviceType).toBe('string');
      expect(typeof result.allowMobile).toBe('boolean');
      expect(typeof result.configFound).toBe('boolean');
      expect(typeof result.shouldBlock).toBe('boolean');
      expect(typeof result.isMobileOrTablet).toBe('boolean');
    });
  });
});
