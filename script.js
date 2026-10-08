(() => {
  const CONDITIONS = { reliable: { label: 'Reliable', probability: 0.95 }, normal: { label: 'Normal', probability: 0.8 }, unstable: { label: 'Unstable', probability: 0.6 } };
  const elements = {
    dataSize: document.querySelector('#dataSize'), packetSize: document.querySelector('#packetSize'), condition: document.querySelector('#networkCondition'), simulations: document.querySelector('#simulationCount'), start: document.querySelector('#startButton'), reset: document.querySelector('#resetButton'), error: document.querySelector('#inputError'),
    dataDisplay: document.querySelector('#dataSizeDisplay'), packetDisplay: document.querySelector('#packetSizeDisplay'), transferCalculation: document.querySelector('#transferCalculation'), conditionName: document.querySelector('#conditionName'), probabilityDisplay: document.querySelector('#probabilityDisplay'), failureDisplay: document.querySelector('#failureDisplay'), heroDataSize: document.querySelector('#heroDataSize'), heroPackets: document.querySelector('#heroPackets'), heroProbability: document.querySelector('#heroProbability'),
    liveStatus: document.querySelector('#liveStatus'), sent: document.querySelector('#sentCount'), liveSuccessful: document.querySelector('#liveSuccessful'), liveFailed: document.querySelector('#liveFailed'), liveRate: document.querySelector('#liveRate'), layer: document.querySelector('#packetsLayer'), log: document.querySelector('#packetLog'), logNote: document.querySelector('#logNote'),
    transferSummary: document.querySelector('#transferSummary'), resultTotal: document.querySelector('#resultTotal'), resultSuccess: document.querySelector('#resultSuccess'), resultFailed: document.querySelector('#resultFailed'), resultRate: document.querySelector('#resultRate'),
    exactHeading: document.querySelector('#exactHeading'), exactCalculation: document.querySelector('#exactCalculation'), exactProbability: document.querySelector('#exactProbability'), atLeast: document.querySelector('#atLeastInput'), atMost: document.querySelector('#atMostInput'), atLeastResult: document.querySelector('#atLeastResult'), atMostResult: document.querySelector('#atMostResult'), tailError: document.querySelector('#tailError'), mean: document.querySelector('#meanValue'), variance: document.querySelector('#varianceValue'), std: document.querySelector('#stdValue'), chart: document.querySelector('#distributionChart'), maxLabel: document.querySelector('#maxSuccessLabel'), binomialModel: document.querySelector('#binomialModel'), binomialDescription: document.querySelector('#binomialDescription'),
    expected: document.querySelector('#expectedSuccesses'), actualAverage: document.querySelector('#actualAverage'), theoreticalRate: document.querySelector('#theoreticalRate'), multipleRate: document.querySelector('#multipleRate'), difference: document.querySelector('#differenceText'), samples: document.querySelector('#simulationSamples'), reliabilityNumber: document.querySelector('#reliabilityNumber'), reliabilityLabel: document.querySelector('#reliabilityLabel'), reliabilityFill: document.querySelector('#reliabilityFill'), lossRate: document.querySelector('#lossRate'), lossFormula: document.querySelector('#lossFormula'), theoreticalFailure: document.querySelector('#theoreticalFailure'), lln: document.querySelector('#llnValues')
  };
  let animationTimer;
  let currentResult = null;

  const logFactorial = (number) => { let total = 0; for (let index = 2; index <= number; index += 1) total += Math.log(index); return total; };
  const factorial = (number) => number < 0 ? NaN : number < 171 ? Math.round(Math.exp(logFactorial(number))) : Infinity;
  const combination = (trials, successes) => successes < 0 || successes > trials ? 0 : Math.exp(logFactorial(trials) - logFactorial(successes) - logFactorial(trials - successes));
  const binomialProbability = (trials, probability, successes) => {
    if (successes < 0 || successes > trials) return 0;
    if (probability === 0) return successes === 0 ? 1 : 0;
    if (probability === 1) return successes === trials ? 1 : 0;
    return Math.exp(logFactorial(trials) - logFactorial(successes) - logFactorial(trials - successes) + successes * Math.log(probability) + (trials - successes) * Math.log1p(-probability));
  };
  const sumProbabilities = (trials, probability, start, end) => { let total = 0; for (let successes = start; successes <= end; successes += 1) total += binomialProbability(trials, probability, successes); return Math.min(1, total); };
  const probabilityAtLeast = (trials, probability, successes) => sumProbabilities(trials, probability, successes, trials);
  const probabilityAtMost = (trials, probability, successes) => sumProbabilities(trials, probability, 0, successes);
  const calculateMean = (trials, probability) => trials * probability;
  const calculateVariance = (trials, probability) => trials * probability * (1 - probability);
  const calculateStandardDeviation = (trials, probability) => Math.sqrt(calculateVariance(trials, probability));
  const simulatePacket = (probability) => Math.random() < probability;
  const calculatePacketCount = (dataSize, packetSize) => Math.ceil(dataSize / packetSize);
  const generateDistribution = (trials, probability) => Array.from({ length: trials + 1 }, (_, successes) => binomialProbability(trials, probability, successes));
  const setText = (element, value) => { element.textContent = value; };
  const formatPercent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
  const compactPercent = (value) => formatPercent(value, Number.isInteger(value * 100) ? 0 : 1);
  const formatSize = (value) => `${Number(value.toFixed(2))} MB`;

  function getSettings() {
    const dataSize = Number(elements.dataSize.value), packetSize = Number(elements.packetSize.value), condition = CONDITIONS[elements.condition.value];
    return { dataSize, packetSize, condition, probability: condition.probability, trials: calculatePacketCount(dataSize, packetSize), simulations: Number(elements.simulations.value) };
  }

  function validateSettings(settings = getSettings()) {
    if (!Number.isFinite(settings.dataSize) || settings.dataSize <= 0) return 'Enter a data size greater than 0 MB.';
    if (!Number.isFinite(settings.packetSize) || settings.packetSize <= 0) return 'Enter a packet size greater than 0 MB.';
    if (!Number.isFinite(settings.trials) || settings.trials > 1000) return 'Choose data and packet sizes that produce 1 to 1,000 packets.';
    return '';
  }

  function updateConfiguration() {
    const settings = getSettings();
    if (validateSettings(settings)) return;
    const remainder = settings.dataSize % settings.packetSize;
    setText(elements.dataDisplay, formatSize(settings.dataSize)); setText(elements.packetDisplay, formatSize(settings.packetSize)); setText(elements.heroDataSize, formatSize(settings.dataSize)); setText(elements.heroPackets, settings.trials); setText(elements.heroProbability, compactPercent(settings.probability));
    setText(elements.conditionName, settings.condition.label.toUpperCase()); setText(elements.probabilityDisplay, `${compactPercent(settings.probability)} SUCCESS`); setText(elements.failureDisplay, `${compactPercent(1 - settings.probability)} failure probability`);
    setText(elements.transferCalculation, `${formatSize(settings.dataSize)} ÷ ${formatSize(settings.packetSize)} = ${settings.trials} packet${settings.trials === 1 ? '' : 's'}${remainder > 0.000001 ? ` · final packet carries ${formatSize(remainder)}` : ''}`);
    setText(elements.sent, `0 / ${settings.trials}`); setText(elements.binomialModel, `${settings.trials} TRIALS`); setText(elements.binomialDescription, `With ${settings.trials} independent packets and ${settings.condition.label} condition probability p = ${settings.probability.toFixed(2)}, total deliveries follow a Binomial distribution.`);
    updateTheoreticalValues(settings); currentResult = null;
  }

  function runSimulation(settings) {
    const outcomes = Array.from({ length: settings.trials }, () => simulatePacket(settings.probability));
    const successes = outcomes.filter(Boolean).length;
    return { ...settings, outcomes, successes, failures: settings.trials - successes };
  }

  function runMultipleSimulations(settings, simulations = settings.simulations) {
    const rates = []; let totalSuccesses = 0;
    for (let simulation = 0; simulation < simulations; simulation += 1) {
      let successes = 0;
      for (let packet = 0; packet < settings.trials; packet += 1) successes += simulatePacket(settings.probability) ? 1 : 0;
      totalSuccesses += successes; rates.push(successes / settings.trials);
    }
    return { simulations, rates, totalSuccesses, totalPackets: settings.trials * simulations, averageSuccesses: totalSuccesses / simulations, rate: totalSuccesses / (settings.trials * simulations) };
  }

  function updateTheoreticalValues(settings) {
    const { trials, probability, condition } = settings, mean = calculateMean(trials, probability), variance = calculateVariance(trials, probability);
    setText(elements.mean, mean.toFixed(2)); setText(elements.variance, variance.toFixed(2)); setText(elements.std, calculateStandardDeviation(trials, probability).toFixed(2)); setText(elements.expected, mean.toFixed(2)); setText(elements.theoreticalRate, formatPercent(probability, 2));
    setText(elements.reliabilityNumber, compactPercent(probability)); setText(elements.reliabilityLabel, `${condition.label}: configured success probability`); elements.reliabilityFill.style.width = `${probability * 100}%`;
    setText(elements.theoreticalFailure, compactPercent(1 - probability)); setText(elements.maxLabel, `${trials} SUCCESS`);
    elements.atLeast.max = trials; elements.atMost.max = trials;
    if (Number(elements.atLeast.value) > trials) elements.atLeast.value = Math.round(mean);
    if (Number(elements.atMost.value) > trials) elements.atMost.value = Math.round(mean);
    updateTailProbabilities(settings); drawDistribution(generateDistribution(trials, probability), trials, null);
  }

  function updateTailProbabilities(settings = getSettings()) {
    const least = Number(elements.atLeast.value), most = Number(elements.atMost.value);
    if (![settings.trials, least, most].every(Number.isFinite) || least < 0 || most < 0 || least > settings.trials || most > settings.trials) { setText(elements.tailError, `Enter k from 0 to ${settings.trials || 'n'}.`); setText(elements.atLeastResult, '—'); setText(elements.atMostResult, '—'); return; }
    setText(elements.tailError, ''); setText(elements.atLeastResult, formatPercent(probabilityAtLeast(settings.trials, settings.probability, least), 3)); setText(elements.atMostResult, formatPercent(probabilityAtMost(settings.trials, settings.probability, most), 3));
  }

  function updateResults(result) {
    const rate = result.successes / result.trials, exact = binomialProbability(result.trials, result.probability, result.successes);
    setText(elements.resultTotal, result.trials); setText(elements.resultSuccess, result.successes); setText(elements.resultFailed, result.failures); setText(elements.resultRate, compactPercent(rate));
    elements.transferSummary.innerHTML = `<strong>TRANSMISSION COMPLETE</strong><span>Data transferred: ${formatSize(result.dataSize)} · Packet size: ${formatSize(result.packetSize)} · Delivered: ${result.successes} · Lost: ${result.failures} · Expected deliveries: ${calculateMean(result.trials, result.probability).toFixed(2)}</span>`;
    setText(elements.exactHeading, `P(X = ${result.successes})`); elements.exactCalculation.innerHTML = `C(${result.trials}, ${result.successes}) × (${result.probability.toFixed(2)})<sup>${result.successes}</sup> × (${(1 - result.probability).toFixed(2)})<sup>${result.failures}</sup><br><small>The theoretical probability of obtaining exactly ${result.successes} successful packets.</small>`; setText(elements.exactProbability, formatPercent(exact, 4));
    setText(elements.lossRate, compactPercent(result.failures / result.trials)); setText(elements.lossFormula, `${result.failures} / ${result.trials} × 100 = ${compactPercent(result.failures / result.trials)}`);
    updateTailProbabilities(result); drawDistribution(generateDistribution(result.trials, result.probability), result.trials, result.successes);
  }

  function drawDistribution(distribution, trials, observed) {
    const canvas = elements.chart, context = canvas.getContext('2d'), rectangle = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    canvas.width = rectangle.width * ratio; canvas.height = rectangle.height * ratio; context.scale(ratio, ratio);
    const width = rectangle.width, height = rectangle.height, padding = { top: 18, right: 12, bottom: 28, left: 36 }, chartWidth = width - padding.left - padding.right, chartHeight = height - padding.top - padding.bottom, maximum = Math.max(...distribution, .01);
    context.clearRect(0, 0, width, height); context.font = '10px DM Mono'; context.strokeStyle = 'rgba(131,160,180,.18)';
    for (let step = 0; step <= 4; step += 1) { const y = padding.top + chartHeight - step / 4 * chartHeight; context.beginPath(); context.moveTo(padding.left, y); context.lineTo(width - padding.right, y); context.stroke(); context.fillStyle = '#7890a3'; context.fillText(`${(maximum * step * 100).toFixed(0)}%`, 1, y + 3); }
    const barWidth = Math.max(1, chartWidth / distribution.length - (distribution.length > 60 ? .5 : 2));
    distribution.forEach((value, index) => { const x = padding.left + index * (chartWidth / distribution.length) + 1, barHeight = Math.max(1, value / maximum * chartHeight), y = padding.top + chartHeight - barHeight; context.fillStyle = index === observed ? '#ffc65a' : '#22c7e5'; context.fillRect(x, y, barWidth, barHeight); });
    const tickCount = trials <= 20 ? trials : 5;
    for (let tick = 0; tick <= tickCount; tick += 1) { const value = Math.round(tick * trials / tickCount), x = padding.left + value * (chartWidth / distribution.length); context.fillStyle = '#7890a3'; context.fillText(value, x, height - 9); }
  }

  function appendLogEvent(index, success) {
    if (index >= 48) return;
    const entry = document.createElement('div'); entry.className = `log-entry ${success ? 'success' : 'failure'}`; entry.innerHTML = `<span>PKT-${String(index + 1).padStart(3, '0')}</span><b>${success ? '✓ DELIVERED' : '× LOST'}</b>`; elements.log.append(entry);
  }

  function animateTransmission(result) {
    window.clearTimeout(animationTimer); elements.layer.innerHTML = ''; elements.log.innerHTML = ''; setText(elements.logNote, 'Packet events are updating progressively…'); elements.liveStatus.innerHTML = '<i></i> TRANSMISSION IN PROGRESS'; elements.liveStatus.classList.add('is-running');
    const displayPackets = Math.min(result.trials, 30); let sent = 0, successes = 0, failures = 0; const batchSize = Math.max(1, Math.ceil(result.trials / 32));
    result.outcomes.slice(0, displayPackets).forEach((success, index) => { const packet = document.createElement('span'); packet.className = `moving-packet ${success ? 'delivered' : 'lost'}`; packet.style.setProperty('--delay', `${index / displayPackets * .85}s`); packet.style.setProperty('--lane', `${(index % 5 - 2) * 13}px`); packet.textContent = success ? '◆' : '◇'; elements.layer.append(packet); });
    const tick = () => { const endpoint = Math.min(result.trials, sent + batchSize); for (; sent < endpoint; sent += 1) { result.outcomes[sent] ? successes += 1 : failures += 1; appendLogEvent(sent, result.outcomes[sent]); } setText(elements.sent, `${sent} / ${result.trials}`); setText(elements.liveSuccessful, successes); setText(elements.liveFailed, failures); setText(elements.liveRate, sent ? compactPercent(successes / sent) : '—'); if (sent < result.trials) animationTimer = window.setTimeout(tick, 38); else animationTimer = window.setTimeout(() => finishTransmission(result), 250); };
    tick();
  }

  function finishTransmission(result) { elements.liveStatus.innerHTML = '<i></i> TRANSMISSION COMPLETE'; elements.liveStatus.classList.remove('is-running'); setText(elements.logNote, `${result.trials} independent packet outcomes recorded.`); if (result.trials > 48) elements.log.insertAdjacentHTML('beforeend', `<div class="log-entry more"><span>+ ${result.trials - 48} additional packet outcomes</span></div>`); updateResults(result); }

  function updateMultiple(result, multiple) {
    setText(elements.actualAverage, multiple.averageSuccesses.toFixed(2)); setText(elements.multipleRate, formatPercent(multiple.rate, 2));
    setText(elements.difference, `${multiple.simulations.toLocaleString()} independent simulation${multiple.simulations === 1 ? '' : 's'} produced an average rate ${formatPercent(multiple.rate, 2)}. This experimental average may be near, but does not have to equal, the configured theoretical probability.`);
    elements.samples.innerHTML = multiple.rates.slice(0, 5).map((rate, index) => `Run ${index + 1}: <b>${formatPercent(rate, 1)}</b>`).join(' · ') + (multiple.simulations > 5 ? ` · <span>${multiple.simulations - 5} more runs</span>` : '');
    elements.lln.innerHTML = [10, 100, 1000].map((count) => { const sample = runMultipleSimulations(result, count); return `<div><span>${count.toLocaleString()} simulations</span><strong>${formatPercent(sample.rate, 2)}</strong></div>`; }).join('');
  }

  function startSimulation() {
    const settings = getSettings(), error = validateSettings(settings); if (error) { setText(elements.error, error); return; }
    setText(elements.error, ''); const result = runSimulation(settings), multiple = runMultipleSimulations(settings); currentResult = result; elements.start.disabled = true; elements.start.innerHTML = '<span>◌</span> TRANSMITTING…'; animateTransmission(result); updateMultiple(result, multiple);
    window.setTimeout(() => { elements.start.disabled = false; elements.start.innerHTML = '<span>🚀</span> START TRANSMISSION'; }, 1250);
  }

  function resetSimulation() {
    window.clearTimeout(animationTimer); currentResult = null; elements.layer.innerHTML = ''; elements.log.innerHTML = ''; setText(elements.logNote, 'Run a simulation to inspect packet outcomes.'); const settings = getSettings(); elements.liveStatus.innerHTML = '<i></i> AWAITING INPUT'; elements.liveStatus.classList.remove('is-running'); setText(elements.sent, `0 / ${settings.trials}`); setText(elements.liveSuccessful, '0'); setText(elements.liveFailed, '0'); setText(elements.liveRate, '—');
    [elements.resultTotal, elements.resultSuccess, elements.resultFailed, elements.resultRate, elements.exactProbability, elements.actualAverage, elements.multipleRate, elements.lossRate].forEach((element) => setText(element, '—')); setText(elements.transferSummary, 'Configure a data transfer, then start transmission to generate real Bernoulli outcomes.'); setText(elements.exactHeading, 'P(X = —)'); setText(elements.exactCalculation, 'Run a simulation to calculate the probability of its observed result.'); setText(elements.lossFormula, 'Failed packets / Total packets × 100'); setText(elements.difference, 'Theoretical probability is configured by the network condition; the experimental rate comes from actual simulated outcomes.'); setText(elements.samples, 'Run multiple simulations to view sample experimental rates.'); updateTheoreticalValues(settings);
  }

  [elements.dataSize, elements.packetSize, elements.condition].forEach((input) => { input.addEventListener('input', updateConfiguration); input.addEventListener('change', updateConfiguration); }); elements.atLeast.addEventListener('input', () => updateTailProbabilities()); elements.atMost.addEventListener('input', () => updateTailProbabilities()); elements.start.addEventListener('click', startSimulation); elements.reset.addEventListener('click', resetSimulation); window.addEventListener('resize', () => { const settings = getSettings(); drawDistribution(generateDistribution(settings.trials, settings.probability), settings.trials, currentResult?.successes ?? null); });
  updateConfiguration();
})();
