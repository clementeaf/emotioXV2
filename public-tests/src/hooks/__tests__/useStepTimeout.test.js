"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var useStepTimeout_1 = require("../useStepTimeout");
// Mock de Date.now para controlar el tiempo
var mockDateNow = jest.fn();
var originalDateNow = Date.now;
beforeAll(function () {
    Date.now = mockDateNow;
});
afterAll(function () {
    Date.now = originalDateNow;
});
describe('useStepTimeout', function () {
    beforeEach(function () {
        jest.clearAllMocks();
        mockDateNow.mockReturnValue(1000000); // Tiempo base
    });
    it('debe inicializar con configuración correcta', function () {
        var config = {
            enabled: true,
            duration: 60,
            warningThreshold: 20,
            autoSubmit: false,
            showWarning: true
        };
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config); }).result;
        expect(result.current.isActive).toBe(false);
        expect(result.current.timeRemaining).toBe(60);
        expect(result.current.isWarning).toBe(false);
        expect(result.current.isExpired).toBe(false);
        expect(result.current.progress).toBe(100);
    });
    it('debe iniciar timeout correctamente', function () {
        var config = {
            enabled: true,
            duration: 30,
            autoSubmit: false
        };
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        expect(result.current.isActive).toBe(true);
        expect(result.current.timeRemaining).toBe(30);
        expect(result.current.progress).toBe(100);
    });
    it('no debe iniciar timeout si no está habilitado', function () {
        var config = {
            enabled: false,
            duration: 30,
            autoSubmit: false
        };
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        expect(result.current.isActive).toBe(false);
    });
    it('debe actualizar tiempo restante correctamente', function () {
        var config = {
            enabled: true,
            duration: 10,
            autoSubmit: false
        };
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        // Simular paso del tiempo
        mockDateNow.mockReturnValue(1000000 + 3000); // +3 segundos
        (0, react_1.act)(function () {
            // Forzar actualización
            jest.advanceTimersByTime(1000);
        });
        expect(result.current.timeRemaining).toBe(7);
        expect(result.current.progress).toBe(70);
    });
    it('debe mostrar advertencia cuando se alcanza el umbral', function () {
        var config = {
            enabled: true,
            duration: 10,
            warningThreshold: 30, // 30% = 3 segundos
            autoSubmit: false
        };
        var onWarning = jest.fn();
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config, undefined, onWarning); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        // Simular paso del tiempo hasta el umbral de advertencia
        mockDateNow.mockReturnValue(1000000 + 7000); // +7 segundos (30% restante)
        (0, react_1.act)(function () {
            jest.advanceTimersByTime(1000);
        });
        expect(result.current.isWarning).toBe(true);
        expect(result.current.timeRemaining).toBe(3);
        expect(result.current.progress).toBe(30);
    });
    it('debe marcar como expirado cuando se agota el tiempo', function () {
        var config = {
            enabled: true,
            duration: 5,
            autoSubmit: false
        };
        var onTimeout = jest.fn();
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config, onTimeout); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        // Simular paso del tiempo completo
        mockDateNow.mockReturnValue(1000000 + 5000); // +5 segundos
        (0, react_1.act)(function () {
            jest.advanceTimersByTime(1000);
        });
        expect(result.current.isExpired).toBe(true);
        expect(result.current.timeRemaining).toBe(0);
        expect(result.current.progress).toBe(0);
        expect(onTimeout).toHaveBeenCalled();
    });
    it('debe pausar y reanudar correctamente', function () {
        var config = {
            enabled: true,
            duration: 10,
            autoSubmit: false
        };
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        // Simular paso del tiempo
        mockDateNow.mockReturnValue(1000000 + 3000); // +3 segundos
        (0, react_1.act)(function () {
            result.current.pauseTimeout();
        });
        expect(result.current.isActive).toBe(false);
        // Simular más tiempo mientras está pausado
        mockDateNow.mockReturnValue(1000000 + 8000); // +8 segundos
        (0, react_1.act)(function () {
            result.current.resumeTimeout();
        });
        expect(result.current.isActive).toBe(true);
        expect(result.current.timeRemaining).toBe(5); // 10 - 3 = 7, pero ajustado por el tiempo pausado
    });
    it('debe resetear correctamente', function () {
        var config = {
            enabled: true,
            duration: 10,
            autoSubmit: false
        };
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        // Simular paso del tiempo
        mockDateNow.mockReturnValue(1000000 + 5000); // +5 segundos
        (0, react_1.act)(function () {
            result.current.resetTimeout();
        });
        expect(result.current.isActive).toBe(false);
        expect(result.current.timeRemaining).toBe(10);
        expect(result.current.isWarning).toBe(false);
        expect(result.current.isExpired).toBe(false);
        expect(result.current.progress).toBe(100);
    });
    it('debe extender el timeout correctamente', function () {
        var config = {
            enabled: true,
            duration: 10,
            autoSubmit: false
        };
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        // Simular paso del tiempo
        mockDateNow.mockReturnValue(1000000 + 5000); // +5 segundos
        (0, react_1.act)(function () {
            result.current.extendTimeout(5); // Agregar 5 segundos
        });
        expect(result.current.timeRemaining).toBe(10); // 15 - 5 = 10
        expect(result.current.progress).toBe(66.67); // 10/15 * 100
    });
    it('debe ejecutar auto-submit cuando está configurado', function () {
        var config = {
            enabled: true,
            duration: 5,
            autoSubmit: true
        };
        var onTimeout = jest.fn();
        var result = (0, react_1.renderHook)(function () { return (0, useStepTimeout_1.useStepTimeout)(config, onTimeout); }).result;
        (0, react_1.act)(function () {
            result.current.startTimeout();
        });
        // Simular paso del tiempo completo
        mockDateNow.mockReturnValue(1000000 + 5000); // +5 segundos
        (0, react_1.act)(function () {
            jest.advanceTimersByTime(1000);
        });
        expect(result.current.isExpired).toBe(true);
        expect(onTimeout).toHaveBeenCalled();
    });
});
