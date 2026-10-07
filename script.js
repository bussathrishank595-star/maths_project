(() => {
  const elements = {
    packetRange: document.querySelector('#packetCount'), packetNumber: document.querySelector('#packetCountNumber'),
    probabilityRange: document.querySelector('#successProbability'), probabilityNumber: document.querySelector('#probabilityNumber'),
    simulations: document.querySelector('#simulationCount'), start: document.querySelector('#startButton'), reset: document.querySelector('#resetButton'),
    error: document.querySelector('#inputError'), packetDisplay: document.querySelector('#packetCountDisplay'), probabilityDisplay: document.querySelector('#probabilityDisplay'),
    heroPackets: document.querySelector('#heroPackets'), heroProbability: document.querySelector('#heroProbability'), liveStatus: document.querySelector('#liveStatus'),
    sent: document.querySelector('#sentCount'), liveSuccessful: document.querySelector('#liveSuccessful'), liveFailed: document.querySelector('#liveFailed'), liveRate: document.querySelector('#liveRate'),
    layer: document.querySelector('#packetsLayer'), log: document.querySelector('#packetLog'), logNote: document.querySelector('#logNote'),
    resultTotal: document.querySelector('#resultTotal'), resultSuccess: document.querySelector('#resultSuccess'), resultFailed: document.querySelector('#resultFailed'), resultRate: document.querySelector('#resultRate'),
    exactHeading: document.querySelector('#exactHeading'), exactCalculation: document.querySelector('#exactCalculation'), exactProbability: document.querySelector('#exactProbability'),
    atLeast: document.querySelector('#atLeastInput'), atMost: document.querySelector('#atMostInput'), atLeastResult: document.querySelector('#atLeastResult'), atMostResult: document.querySelector('#atMostResult'), tailError: document.querySelector('#tailError'),
    mean: document.querySelector('#meanValue'), variance: document.querySelector('#varianceValue'), std: document.querySelector('#stdValue'), chart: document.querySelector('#distributionChart'), maxLabel: document.querySelector('#maxSuccessLabel'),
    expected: document.querySelector('#expectedSuccesses'), actualAverage: document.querySelector('#actualAverage'), theoreticalRate: document.querySelector('#theoreticalRate'), multipleRate: document.querySelector('#multipleRate'), difference: document.querySelector('#differenceText'),
    reliabilityNumber: document.querySelector('#reliabilityNumber'), reliabilityFill: document.querySelector('#reliabilityFill'), lossRate: document.querySelector('#lossRate'), lossFormula: document.querySelector('#lossFormula'), theoreticalFailure: document.querySelector('#theoreticalFailure'), lln: document.querySelector('#llnValues')
  };

  let animationTimer;
  let currentResult = null;

  // Uses logarithms to avoid factorial overflow when n is large.
  const logFactorial = (number) => { let sum = 0; for (let index = 2; index <= number; index += 1) sum += Math.log(index); return sum; };
  const factorial = (number) => number < 0 ? NaN : number < 171 ? Math.round(Math.exp(logFactorial(number))) : Infinity;
  const combination = (trials, successes) => (successes < 0 || successes > trials) ? 0 : Math.exp(logFactorial(trials) - logFactorial(successes) - logFactorial(trials - successes));
  const binomialProbability = (trials, probability, successes) => {
    if (successes < 0 || successes > trials) return 0;
    if (probability === 0) return successes === 0 ? 1 : 0;
    if (probability === 1) return successes === trials ? 1 : 0;
    const logValue = logFactorial(trials) - logFactorial(successes) - logFactorial(trials - successes) + successes * Math.log(probability) + (trials - successes) * Math.log1p(-probability);
    return Math.exp(logValue);
  };
  const probabilityAtLeast = (trials, probability, successes) => sumProbabilities(trials, probability, successes, trials);
  const probabilityAtMost = (trials, probability, successes) => sumProbabilities(trials, probability, 0, successes);
  const sumProbabilities = (trials, probability, from, to) => { let total = 0; for (let successes = from; successes <= to; successes += 1) total += binomialProbability(trials, probability, successes); return Math.min(1, total); };
  const calculateMean = (trials, probability) => trials * probability;
  const calculateVariance = (trials, probability) => trials * probability * (1 - probability);
  const calculateStandardDeviation = (trials, probability) => Math.sqrt(calculateVariance(trials, probability));
  const simulatePacket = (probability) => Math.random() < probability;
  const generateDistribution = (trials, probability) => Array.from({ length: trials + 1 }, (_, successes) => binomialProbability(trials, probability, successes));

  const getSettings = () => ({ trials: Number(elements.packetNumber.value), probability: Number(elements.probabilityNumber.value) / 100, simulations: Number(elements.simulations.value) });
  const formatPercent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
  const compactPercent = (value) => formatPercent(value, value * 100 % 1 === 0 ? 0 : 1);
  const setText = (element, text) => { element.textContent = text; };

  function validateSettings() {
    const { trials, probability } = getSettings();
    if (!Number.isInteger(trials) || trials < 1 || trials > 1000) return 'Enter a whole packet count from 1 to 1,000.';
    if (!Number.isFinite(probability) || probability < 0 || probability > 1) return 'Enter a success probability from 0% to 100%.';
    return '';
  }

  function syncInputs(source) {
    const packetValue = source === 'rangePackets' ? elements.packetRange.value : elements.packetNumber.value;
    const probabilityValue = source === 'rangeProbability' ? elements.probabilityRange.value : elements.probabilityNumber.value;
    if (source.includes('Packets')) { elements.packetRange.value = packetValue; elements.packetNumber.value = packetValue; }
    if (source.includes('Probability')) { elements.probabilityRange.value = probabilityValue; elements.probabilityNumber.value = probabilityValue; }
    const { trials, probability } = getSettings();
    setText(elements.packetDisplay, trials || '—'); setText(elements.probabilityDisplay, Number.isFinite(probability) ? compactPercent(probability) : '—');
    setText(elements.heroPackets, trials || '—'); setText(elements.heroProbability, Number.isFinite(probability) ? compactPercent(probability) : '—');
    updateTheoreticalValues(trials, probability);
  }

  function runSimulation(trials, probability) {
    const outcomes = Array.from({ length: trials }, () => simulatePacket(probability));
    const successes = outcomes.filter(Boolean).length;
    return { trials, probability, outcomes, successes, failures: trials - successes };
  }

  function runMultipleSimulations(trials, probability, simulations) {
    let totalSuccesses = 0;
    for (let simulation = 0; simulation < simulations; simulation += 1) {
      for (let packet = 0; packet < trials; packet += 1) totalSuccesses += simulatePacket(probability) ? 1 : 0;
    }
    const totalPackets = trials * simulations;
    return { simulations, totalSuccesses, totalPackets, averageSuccesses: totalSuccesses / simulations, averageFailures: (totalPackets - totalSuccesses) / simulations, rate: totalSuccesses / totalPackets };
  }

  function updateTheoreticalValues(trials, probability) {
    if (!Number.isFinite(trials) || !Number.isFinite(probability) || trials < 1 || probability < 0 || probability > 1) return;
    const mean = calculateMean(trials, probability), variance = calculateVariance(trials, probability);
    setText(elements.mean, mean.toFixed(2)); setText(elements.variance, variance.toFixed(2)); setText(elements.std, Math.sqrt(variance).toFixed(2));
    setText(elements.expected, mean.toFixed(2)); setText(elements.theoreticalRate, formatPercent(probability, 2));
    setText(elements.reliabilityNumber, compactPercent(probability)); elements.reliabilityFill.style.width = `${probability * 100}%`;
    setText(elements.theoreticalFailure, compactPercent(1 - probability)); setText(elements.maxLabel, `${trials} SUCCESS`);
    elements.atLeast.max = trials; elements.atMost.max = trials;
    if (Number(elements.atLeast.value) > trials) elements.atLeast.value = trials;
    if (Number(elements.atMost.value) > trials) elements.atMost.value = trials;
    updateTailProbabilities(); drawDistribution(generateDistribution(trials, probability), trials, null);
  }

  function updateResults(result) {
    const rate = result.successes / result.trials;
    setText(elements.resultTotal, result.trials); setText(elements.resultSuccess, result.successes); setText(elements.resultFailed, result.failures); setText(elements.resultRate, compactPercent(rate));
    setText(elements.exactHeading, `P(X = ${result.successes})`);
    const probability = binomialProbability(result.trials, result.probability, result.successes);
    elements.exactCalculation.innerHTML = `C(${result.trials}, ${result.successes}) × (${result.probability.toFixed(2)})<sup>${result.successes}</sup> × (${(1 - result.probability).toFixed(2)})<sup>${result.failures}</sup>`;
    setText(elements.exactProbability, formatPercent(probability, 4));
    setText(elements.lossRate, compactPercent(result.failures / result.trials)); setText(elements.lossFormula, `${result.failures} / ${result.trials} × 100 = ${compactPercent(result.failures / result.trials)}`);
    updateTailProbabilities(); drawDistribution(generateDistribution(result.trials, result.probability), result.trials, result.successes);
  }

  function updateTailProbabilities() {
    const { trials, probability } = getSettings(); const least = Number(elements.atLeast.value), most = Number(elements.atMost.value);
    if (![trials, probability, least, most].every(Number.isFinite) || least < 0 || most < 0 || least > trials || most > trials) { setText(elements.tailError, `Enter k from 0 to ${trials || 'n'}.`); setText(elements.atLeastResult, '—'); setText(elements.atMostResult, '—'); return; }
    setText(elements.tailError, ''); setText(elements.atLeastResult, formatPercent(probabilityAtLeast(trials, probability, least), 3)); setText(elements.atMostResult, formatPercent(probabilityAtMost(trials, probability, most), 3));
  }

  function drawDistribution(distribution, trials, observed) {
    const canvas = elements.chart, context = canvas.getContext('2d'), rectangle = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    canvas.width = rectangle.width * ratio; canvas.height = rectangle.height * ratio; context.scale(ratio, ratio);
    const width = rectangle.width, height = rectangle.height, padding = { top: 18, right: 12, bottom: 28, left: 36 }, chartWidth = width - padding.left - padding.right, chartHeight = height - padding.top - padding.bottom;
    context.clearRect(0, 0, width, height); context.font = '10px DM Mono'; context.fillStyle = '#7890a3'; context.strokeStyle = 'rgba(131,160,180,.18)';
    const maximum = Math.max(...distribution, 0.01);
    for (let step = 0; step <= 4; step += 1) { const y = padding.top + chartHeight - (step / 4) * chartHeight; context.beginPath(); context.moveTo(padding.left, y); context.lineTo(width - padding.right, y); context.stroke(); context.fillText(`${(maximum * step * 100).toFixed(0)}%`, 1, y + 3); }
    const barWidth = Math.max(1, chartWidth / distribution.length - (distribution.length > 60 ? 0.5 : 2));
    distribution.forEach((value, index) => { const x = padding.left + index * (chartWidth / distribution.length) + 1; const barHeight = Math.max(1, (value / maximum) * chartHeight); const y = padding.top + chartHeight - barHeight; context.fillStyle = index === observed ? '#ffc65a' : '#22c7e5'; context.fillRect(x, y, barWidth, barHeight); });
    const ticks = trials <= 20 ? trials : 5; for (let tick = 0; tick <= ticks; tick += 1) { const value = Math.round(tick * trials / ticks); const x = padding.left + value * (chartWidth / distribution.length); context.fillStyle = '#7890a3'; context.fillText(value, x, height - 9); }
  }

  function renderLog(result) {
    const visible = result.outcomes.slice(0, 48);
    elements.log.innerHTML = visible.map((success, index) => `<div class="log-entry ${success ? 'success' : 'failure'}"><span>PKT-${String(index + 1).padStart(3, '0')}</span><b>${success ? '✓ DELIVERED' : '× LOST'}</b></div>`).join('') + (result.outcomes.length > visible.length ? `<div class="log-entry more"><span>+ ${result.outcomes.length - visible.length} additional packets</span></div>` : '');
    setText(elements.logNote, `${result.trials} packet events recorded.`);
  }

  function animateTransmission(result) {
    window.clearTimeout(animationTimer); elements.layer.innerHTML = ''; elements.log.innerHTML = ''; setText(elements.logNote, 'Transmission is underway…');
    elements.liveStatus.innerHTML = '<i></i> TRANSMISSION IN PROGRESS'; elements.liveStatus.classList.add('is-running');
    let sent = 0, successes = 0, failures = 0; const batchSize = Math.max(1, Math.ceil(result.trials / 32));
    const showPackets = Math.min(result.trials, 30);
    result.outcomes.slice(0, showPackets).forEach((success, index) => { const packet = document.createElement('span'); packet.className = `moving-packet ${success ? 'delivered' : 'lost'}`; packet.style.setProperty('--delay', `${(index / showPackets) * .85}s`); packet.style.setProperty('--lane', `${(index % 5 - 2) * 13}px`); packet.textContent = success ? '◆' : '◇'; elements.layer.append(packet); });
    const tick = () => { const endpoint = Math.min(result.trials, sent + batchSize); for (; sent < endpoint; sent += 1) result.outcomes[sent] ? successes += 1 : failures += 1; setText(elements.sent, `${sent} / ${result.trials}`); setText(elements.liveSuccessful, successes); setText(elements.liveFailed, failures); setText(elements.liveRate, sent ? compactPercent(successes / sent) : '—'); if (sent < result.trials) { animationTimer = window.setTimeout(tick, 38); } else { animationTimer = window.setTimeout(() => finishTransmission(result), 280); } };
    tick();
  }

  function finishTransmission(result) {
    elements.liveStatus.innerHTML = '<i></i> TRANSMISSION COMPLETE'; elements.liveStatus.classList.remove('is-running'); renderLog(result); updateResults(result);
  }

  function updateMultiple(result, multiple) {
    if (multiple.simulations === 1) { setText(elements.actualAverage, result.successes.toFixed(2)); setText(elements.multipleRate, compactPercent(result.successes / result.trials)); setText(elements.difference, 'One simulation is an experimental outcome; it is not expected to exactly match the theoretical mean.'); }
    else { setText(elements.actualAverage, multiple.averageSuccesses.toFixed(2)); setText(elements.multipleRate, formatPercent(multiple.rate, 2)); setText(elements.difference, `Across ${multiple.simulations.toLocaleString()} simulations, the experimental average differs from theory by ${Math.abs(multiple.averageSuccesses - calculateMean(result.trials, result.probability)).toFixed(3)} packets per simulation.`); }
    const sampleSizes = [10, 100, 1000];
    elements.lln.innerHTML = sampleSizes.map((count) => { const sample = runMultipleSimulations(result.trials, result.probability, count); return `<div><span>${count.toLocaleString()} simulations</span><strong>${formatPercent(sample.rate, 2)}</strong></div>`; }).join('');
  }

  function startSimulation() {
    const error = validateSettings(); if (error) { setText(elements.error, error); return; }
    setText(elements.error, ''); const { trials, probability, simulations } = getSettings(); const result = runSimulation(trials, probability); const multiple = runMultipleSimulations(trials, probability, simulations); currentResult = result;
    elements.start.disabled = true; elements.start.innerHTML = '<span>◌</span> TRANSMITTING…'; animateTransmission(result); updateMultiple(result, multiple);
    window.setTimeout(() => { elements.start.disabled = false; elements.start.innerHTML = '<span>🚀</span> START TRANSMISSION'; }, Math.max(900, Math.min(2000, trials * 38 / Math.max(1, Math.ceil(trials / 32)))));
  }

  function resetSimulation() {
    window.clearTimeout(animationTimer); currentResult = null; elements.layer.innerHTML = ''; elements.log.innerHTML = ''; setText(elements.logNote, 'Run a simulation to inspect packet outcomes.');
    elements.liveStatus.innerHTML = '<i></i> AWAITING INPUT'; elements.liveStatus.classList.remove('is-running'); setText(elements.sent, `0 / ${elements.packetNumber.value}`); setText(elements.liveSuccessful, '0'); setText(elements.liveFailed, '0'); setText(elements.liveRate, '—');
    [elements.resultTotal, elements.resultSuccess, elements.resultFailed, elements.resultRate, elements.exactProbability, elements.actualAverage, elements.multipleRate, elements.lossRate].forEach((element) => setText(element, '—'));
    setText(elements.exactHeading, 'P(X = —)'); setText(elements.exactCalculation, 'Run a simulation to calculate the probability of its observed result.'); setText(elements.lossFormula, 'Failed packets / Total packets × 100'); setText(elements.difference, 'Select a multi-run mode and start transmission to compare repeated experiments.');
    updateTheoreticalValues(getSettings().trials, getSettings().probability);
  }

  elements.packetRange.addEventListener('input', () => syncInputs('rangePackets')); elements.packetNumber.addEventListener('input', () => syncInputs('numberPackets'));
  elements.probabilityRange.addEventListener('input', () => syncInputs('rangeProbability')); elements.probabilityNumber.addEventListener('input', () => syncInputs('numberProbability'));
  elements.atLeast.addEventListener('input', updateTailProbabilities); elements.atMost.addEventListener('input', updateTailProbabilities); elements.start.addEventListener('click', startSimulation); elements.reset.addEventListener('click', resetSimulation);
  document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => { elements.packetRange.value = 20; elements.packetNumber.value = 20; elements.probabilityRange.value = button.dataset.preset; elements.probabilityNumber.value = button.dataset.preset; syncInputs('rangeProbability'); }));
  window.addEventListener('resize', () => { const { trials, probability } = getSettings(); drawDistribution(generateDistribution(trials, probability), trials, currentResult?.successes ?? null); });
  syncInputs('rangePackets');
})();
