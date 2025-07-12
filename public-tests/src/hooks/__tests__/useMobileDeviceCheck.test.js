"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var participantStore_1 = require("../../stores/participantStore");
var useMobileDeviceCheck_1 = require("../useMobileDeviceCheck");
// Mock del store
jest.mock('../../stores/participantStore', function () { return ({
    useParticipantStore: jest.fn()
}); });
var mockUseParticipantStore = participantStore_1.useParticipantStore;
describe('useMobileDeviceCheck', function () {
    beforeEach(function () {
        jest.clearAllMocks();
    });
    describe('Configuración de dispositivos móviles', function () {
        it('debe permitir móviles cuando no hay configuración', function () {
            mockUseParticipantStore.mockReturnValue('desktop');
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(null, false);
            expect(result.allowMobile).toBe(true);
            expect(result.configFound).toBe(false);
            expect(result.shouldBlock).toBe(false);
        });
        it('debe permitir móviles cuando allowMobile es true', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: true };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(true);
            expect(result.configFound).toBe(true);
            expect(result.shouldBlock).toBe(false);
        });
        it('debe bloquear móviles cuando allowMobile es false', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(false);
            expect(result.configFound).toBe(true);
            expect(result.shouldBlock).toBe(true);
        });
        it('debe permitir desktop incluso cuando allowMobile es false', function () {
            mockUseParticipantStore.mockReturnValue('desktop');
            var config = { allowMobile: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(false);
            expect(result.configFound).toBe(true);
            expect(result.shouldBlock).toBe(false);
        });
    });
    describe('Diferentes formatos de configuración', function () {
        it('debe leer allowMobile desde linkConfig', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = {
                linkConfig: { allowMobile: false }
            };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(false);
            expect(result.configFound).toBe(true);
        });
        it('debe leer allowMobileDevices desde linkConfig', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = {
                linkConfig: { allowMobileDevices: false }
            };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(false);
            expect(result.configFound).toBe(true);
        });
        it('debe leer allowMobile desde la raíz del config', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(false);
            expect(result.configFound).toBe(true);
        });
        it('debe leer allowMobileDevices desde la raíz del config', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobileDevices: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(false);
            expect(result.configFound).toBe(true);
        });
        it('debe priorizar linkConfig.allowMobile sobre otros valores', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = {
                linkConfig: { allowMobile: false },
                allowMobile: true,
                allowMobileDevices: true
            };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(false);
            expect(result.configFound).toBe(true);
        });
    });
    describe('Detección de tipo de dispositivo', function () {
        it('debe detectar móvil correctamente', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)({ allowMobile: false }, false);
            expect(result.deviceType).toBe('mobile');
            expect(result.isMobileOrTablet).toBe(true);
        });
        it('debe detectar tablet correctamente', function () {
            mockUseParticipantStore.mockReturnValue('tablet');
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)({ allowMobile: false }, false);
            expect(result.deviceType).toBe('tablet');
            expect(result.isMobileOrTablet).toBe(true);
        });
        it('debe detectar desktop correctamente', function () {
            mockUseParticipantStore.mockReturnValue('desktop');
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)({ allowMobile: false }, false);
            expect(result.deviceType).toBe('desktop');
            expect(result.isMobileOrTablet).toBe(false);
        });
    });
    describe('Estado de carga', function () {
        it('no debe bloquear durante la carga', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, true);
            expect(result.shouldBlock).toBe(false);
        });
        it('debe bloquear después de la carga si corresponde', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.shouldBlock).toBe(true);
        });
    });
    describe('Casos edge', function () {
        it('debe manejar configuración undefined', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: undefined };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(true);
            expect(result.configFound).toBe(false);
        });
        it('debe manejar configuración null', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: null };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(true);
            expect(result.configFound).toBe(false);
        });
        it('debe manejar configuración vacía', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = {};
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.allowMobile).toBe(true);
            expect(result.configFound).toBe(false);
        });
        it('debe manejar deviceType null', function () {
            mockUseParticipantStore.mockReturnValue(null);
            var config = { allowMobile: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result.deviceType).toBe(null);
            expect(result.isMobileOrTablet).toBe(false);
            expect(result.shouldBlock).toBe(false);
        });
    });
    describe('Valores de retorno', function () {
        it('debe retornar todos los valores esperados', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(result).toHaveProperty('deviceType');
            expect(result).toHaveProperty('allowMobile');
            expect(result).toHaveProperty('configFound');
            expect(result).toHaveProperty('shouldBlock');
            expect(result).toHaveProperty('isMobileOrTablet');
        });
        it('debe tener tipos correctos para todos los valores', function () {
            mockUseParticipantStore.mockReturnValue('mobile');
            var config = { allowMobile: false };
            var result = (0, useMobileDeviceCheck_1.useMobileDeviceCheck)(config, false);
            expect(typeof result.deviceType).toBe('string');
            expect(typeof result.allowMobile).toBe('boolean');
            expect(typeof result.configFound).toBe('boolean');
            expect(typeof result.shouldBlock).toBe('boolean');
            expect(typeof result.isMobileOrTablet).toBe('boolean');
        });
    });
});
