"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var StepTimeoutDisplay_1 = require("../StepTimeoutDisplay");
describe('StepTimeoutDisplay', function () {
    var createTimeoutState = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        return (__assign({ isActive: true, timeRemaining: 60, isWarning: false, isExpired: false, progress: 100 }, overrides));
    };
    it('no debe renderizar cuando no está activo', function () {
        var timeoutState = createTimeoutState({ isActive: false });
        var container = (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState}/>).container;
        expect(container.firstChild).toBeNull();
    });
    it('debe mostrar tiempo en formato correcto para variante minimal', function () {
        var timeoutState = createTimeoutState({ timeRemaining: 65 });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="minimal"/>);
        expect(react_1.screen.getByText('1:05')).toBeInTheDocument();
    });
    it('debe mostrar tiempo en segundos cuando es menor a 1 minuto', function () {
        var timeoutState = createTimeoutState({ timeRemaining: 45 });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="minimal"/>);
        expect(react_1.screen.getByText('45s')).toBeInTheDocument();
    });
    it('debe mostrar indicador de advertencia cuando isWarning es true', function () {
        var timeoutState = createTimeoutState({
            timeRemaining: 10,
            isWarning: true,
            progress: 20
        });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="minimal"/>);
        var warningIndicator = react_1.screen.getByRole('generic').querySelector('.bg-orange-500');
        expect(warningIndicator).toBeInTheDocument();
    });
    it('debe mostrar indicador de expirado cuando isExpired es true', function () {
        var timeoutState = createTimeoutState({
            timeRemaining: 0,
            isExpired: true,
            progress: 0
        });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="minimal"/>);
        var expiredIndicator = react_1.screen.getByRole('generic').querySelector('.bg-red-500');
        expect(expiredIndicator).toBeInTheDocument();
    });
    it('debe mostrar variante detailed correctamente', function () {
        var timeoutState = createTimeoutState({ timeRemaining: 30 });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="detailed"/>);
        expect(react_1.screen.getByText('Tiempo restante')).toBeInTheDocument();
        expect(react_1.screen.getByText('30s')).toBeInTheDocument();
        // Verificar que la barra de progreso existe
        var progressBar = react_1.screen.getByRole('generic').querySelector('.bg-blue-500');
        expect(progressBar).toBeInTheDocument();
    });
    it('debe mostrar mensaje de advertencia en variante detailed', function () {
        var timeoutState = createTimeoutState({
            timeRemaining: 10,
            isWarning: true,
            progress: 20
        });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="detailed"/>);
        expect(react_1.screen.getByText('⚠️ Tiempo limitado')).toBeInTheDocument();
    });
    it('debe mostrar mensaje de expirado en variante detailed', function () {
        var timeoutState = createTimeoutState({
            timeRemaining: 0,
            isExpired: true,
            progress: 0
        });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="detailed"/>);
        expect(react_1.screen.getByText('⏰ Tiempo agotado')).toBeInTheDocument();
    });
    it('debe mostrar variante progress-bar correctamente', function () {
        var timeoutState = createTimeoutState({ timeRemaining: 45 });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="progress-bar"/>);
        expect(react_1.screen.getByText('Límite de tiempo')).toBeInTheDocument();
        expect(react_1.screen.getByText('45s')).toBeInTheDocument();
        expect(react_1.screen.getByText('0s')).toBeInTheDocument();
        // Verificar que la barra de progreso existe
        var progressBar = react_1.screen.getByRole('generic').querySelector('.bg-blue-500');
        expect(progressBar).toBeInTheDocument();
    });
    it('debe aplicar colores correctos según el estado', function () {
        // Estado normal
        var normalState = createTimeoutState({ timeRemaining: 60 });
        var rerender = (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={normalState} variant="minimal"/>).rerender;
        expect(react_1.screen.getByText('1:00')).toHaveClass('text-neutral-600');
        // Estado de advertencia
        var warningState = createTimeoutState({
            timeRemaining: 10,
            isWarning: true,
            progress: 20
        });
        rerender(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={warningState} variant="minimal"/>);
        expect(react_1.screen.getByText('10s')).toHaveClass('text-orange-600');
        // Estado expirado
        var expiredState = createTimeoutState({
            timeRemaining: 0,
            isExpired: true,
            progress: 0
        });
        rerender(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={expiredState} variant="minimal"/>);
        expect(react_1.screen.getByText('0s')).toHaveClass('text-red-600');
    });
    it('debe aplicar clases CSS personalizadas', function () {
        var timeoutState = createTimeoutState({ timeRemaining: 30 });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="minimal" className="custom-class"/>);
        expect(react_1.screen.getByRole('generic')).toHaveClass('custom-class');
    });
    it('debe ocultar progreso cuando showProgress es false', function () {
        var timeoutState = createTimeoutState({ timeRemaining: 30 });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="detailed" showProgress={false}/>);
        // La barra de progreso no debe estar presente
        var progressBar = react_1.screen.getByRole('generic').querySelector('.bg-blue-500');
        expect(progressBar).not.toBeInTheDocument();
    });
    it('debe ocultar advertencia cuando showWarning es false', function () {
        var timeoutState = createTimeoutState({
            timeRemaining: 10,
            isWarning: true,
            progress: 20
        });
        (0, react_1.render)(<StepTimeoutDisplay_1.StepTimeoutDisplay timeoutState={timeoutState} variant="detailed" showWarning={false}/>);
        // El mensaje de advertencia no debe estar presente
        expect(react_1.screen.queryByText('⚠️ Tiempo limitado')).not.toBeInTheDocument();
    });
});
