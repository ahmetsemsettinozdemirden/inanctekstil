(function () {
    'use strict';

    const data = window.iccData;
    if (!data) return;

    data.pricePerMeter = parseFloat(data.pricePerMeter) || 0;
    data.tulSewingCost = parseFloat(data.tulSewingCost) || 0;
    data.fonSewingCost = parseFloat(data.fonSewingCost) || 0;
    data.satenPrice = parseFloat(data.satenPrice) || 0;

    const resultDiv = document.getElementById('icc-result');
    const errorDiv = document.getElementById('icc-error');

    if (!resultDiv || !errorDiv) return;

    function formatPrice(amount) {
        return amount.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + ' ' + data.currency;
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        resultDiv.style.display = 'none';
    }

    function showResult(resultData) {
        errorDiv.style.display = 'none';
        resultDiv.style.display = 'block';

        if (data.productType === 'tul') {
            resultDiv.querySelector('.icc-fabric-meters').textContent = resultData.fabricMeters;
            resultDiv.querySelector('.icc-fabric-cost').textContent = formatPrice(resultData.fabricCost);
            resultDiv.querySelector('.icc-sewing-cost').textContent = formatPrice(resultData.sewingCost);
            resultDiv.querySelector('.icc-total').textContent = formatPrice(resultData.total);
        } else if (data.productType === 'fon' || data.productType === 'blackout') {
            resultDiv.querySelector('.icc-fabric-per-panel').textContent = resultData.fabricPerPanel;
            resultDiv.querySelector('.icc-total-fabric').textContent = resultData.totalFabric;
            resultDiv.querySelector('.icc-fabric-cost').textContent = formatPrice(resultData.fabricCost);
            resultDiv.querySelector('.icc-sewing-cost').textContent = formatPrice(resultData.sewingCost);
            resultDiv.querySelector('.icc-total').textContent = formatPrice(resultData.total);
        }
    }

    function calculateTul() {
        const widthInput = document.getElementById('icc-window-width');
        const pleatSelect = document.getElementById('icc-pleat-ratio');

        if (!widthInput || !pleatSelect) return;

        const width = parseInt(widthInput.value, 10);
        const pleatRatio = parseFloat(pleatSelect.value);

        if (isNaN(width) || width < 100 || width > 600) {
            showError('Pencere eni 100-600 cm arasinda olmalidir.');
            return;
        }

        if (isNaN(pleatRatio)) {
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            return;
        }

        const fabricMeters = (width / 100) * pleatRatio;
        const fabricCost = fabricMeters * data.pricePerMeter;
        const sewingCost = fabricMeters * data.tulSewingCost;
        const total = fabricCost + sewingCost;

        showResult({
            fabricMeters: fabricMeters.toFixed(2),
            fabricCost: fabricCost,
            sewingCost: sewingCost,
            total: total,
        });
    }

    function calculateFon() {
        const widthInput = document.getElementById('icc-panel-width');
        const pleatSelect = document.getElementById('icc-pleat-ratio');

        if (!widthInput || !pleatSelect) return;

        const width = parseInt(widthInput.value, 10);
        const pleatRatio = parseFloat(pleatSelect.value);

        if (isNaN(width) || width < 50 || width > 150) {
            showError('Panel eni 50-150 cm arasinda olmalidir.');
            return;
        }

        if (isNaN(pleatRatio)) {
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            return;
        }

        const fabricPerPanel = (width / 100) * pleatRatio;
        const totalFabric = fabricPerPanel * 2;
        const fabricCost = totalFabric * data.pricePerMeter;
        const sewingCost = data.fonSewingCost;
        const total = fabricCost + sewingCost;

        showResult({
            fabricPerPanel: fabricPerPanel.toFixed(2),
            totalFabric: totalFabric.toFixed(2),
            fabricCost: fabricCost,
            sewingCost: sewingCost,
            total: total,
        });
    }

    if (data.productType === 'tul') {
        const widthInput = document.getElementById('icc-window-width');
        const pleatSelect = document.getElementById('icc-pleat-ratio');

        if (widthInput) widthInput.addEventListener('input', calculateTul);
        if (pleatSelect) pleatSelect.addEventListener('change', calculateTul);

    } else if (data.productType === 'fon' || data.productType === 'blackout') {
        const widthInput = document.getElementById('icc-panel-width');
        const pleatSelect = document.getElementById('icc-pleat-ratio');

        if (widthInput) widthInput.addEventListener('input', calculateFon);
        if (pleatSelect) pleatSelect.addEventListener('change', calculateFon);
    }
})();
