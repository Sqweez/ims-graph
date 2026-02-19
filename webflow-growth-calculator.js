(function () {
  'use strict';

  var COLORS = {
    black: '#212125',
    darkGrey: '#73737F',
    grey: '#BFBFBF',
    white: '#FFFFFF',
    blue: '#0E64E0',
    revenue: '#63C56B',
    variable: '#D66B90',
    fixed: '#B8B8C5',
    total: '#56566C',
    grid: '#E6E6EC'
  };

  var WEEKS_PER_YEAR = 52.1775;
  var WEEKS_PER_QUARTER = 13.044375;
  var WEEKS_PER_MONTH = WEEKS_PER_YEAR / 12;

  var DEFAULTS = {
    units: 'week',
    weeklyRevenue0: 100,
    weeklyGrowthRate: 0.0353,
    grossMargin: 1,
    weeklyFixedExpenses: 1600,
    yearsMin: 1,
    yearsMax: 9
  };

  function unitWeeks(units) {
    if (units === 'week') {
      return 1;
    }
    if (units === 'month') {
      return WEEKS_PER_MONTH;
    }
    if (units === 'quarter') {
      return WEEKS_PER_QUARTER;
    }
    return WEEKS_PER_YEAR;
  }

  function isValidUnit(units) {
    return units === 'week' || units === 'month' || units === 'quarter' || units === 'year';
  }

  function flowToWeekly(value, units) {
    return value / unitWeeks(units);
  }

  function flowFromWeekly(value, units) {
    return value * unitWeeks(units);
  }

  function growthToWeekly(value, units) {
    if (value <= -0.999999) {
      return -0.999999;
    }
    return Math.exp(Math.log(1 + value) / unitWeeks(units)) - 1;
  }

  function growthFromWeekly(value, units) {
    return Math.exp(Math.log(1 + value) * unitWeeks(units)) - 1;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function isFiniteNumber(value) {
    return Number.isFinite(value) && !Number.isNaN(value);
  }

  function formatMoney(value) {
    if (!isFiniteNumber(value)) {
      return '$0';
    }

    var abs = Math.abs(value);
    var suffix = '';
    var scaled = abs;

    if (abs >= 999e9) {
      suffix = 'T';
      scaled = abs / 1e12;
    } else if (abs >= 999e6) {
      suffix = 'B';
      scaled = abs / 1e9;
    } else if (abs >= 999e3) {
      suffix = 'M';
      scaled = abs / 1e6;
    } else if (abs >= 1e4) {
      suffix = 'K';
      scaled = abs / 1e3;
    }

    var digits = scaled >= 1000 ? 0 : scaled >= 100 ? 1 : scaled >= 10 ? 2 : 2;
    var text = scaled.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    return (value < 0 ? '-$' : '$') + text + suffix;
  }

  function formatInputMoney(value) {
    if (!isFiniteNumber(value)) {
      return '$0';
    }
    return '$' + Math.max(0, value).toFixed(0);
  }

  function formatInputPercent(value) {
    if (!isFiniteNumber(value)) {
      return '0%';
    }
    return (value * 100).toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1') + '%';
  }

  function parseMoney(text) {
    if (typeof text !== 'string') {
      return NaN;
    }
    var normalized = text.replace(/[^0-9.\-]/g, '');
    return Number(normalized);
  }

  function parsePercent(text) {
    if (typeof text !== 'string') {
      return NaN;
    }
    var normalized = text.replace(/[^0-9.\-]/g, '');
    var raw = Number(normalized);
    if (!isFiniteNumber(raw)) {
      return NaN;
    }
    return raw / 100;
  }

  function createSvgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function setAttrs(node, attrs) {
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
  }

  function createNiceTicks(minValue, maxValue, targetCount) {
    var min = Math.max(1, minValue);
    var max = Math.max(min * 1.01, maxValue);
    var bases = [1, 2.5, 5];
    var ticks = [];

    var minExp = Math.floor(Math.log10(min)) - 1;
    var maxExp = Math.ceil(Math.log10(max)) + 1;

    for (var exp = minExp; exp <= maxExp; exp += 1) {
      var scale = Math.pow(10, exp);
      for (var i = 0; i < bases.length; i += 1) {
        var tick = bases[i] * scale;
        if (tick >= min * 0.98 && tick <= max * 1.02) {
          ticks.push(tick);
        }
      }
    }

    ticks = ticks.filter(function (v, idx, arr) {
      if (idx === 0) {
        return true;
      }
      return Math.abs(v - arr[idx - 1]) > 1e-9;
    });

    if (ticks.length < 2) {
      ticks = [min, max];
    }

    if (ticks.length > targetCount) {
      var step = Math.ceil(ticks.length / targetCount);
      ticks = ticks.filter(function (_v, idx) {
        return idx % step === 0;
      });
      if (ticks[ticks.length - 1] < max) {
        ticks.push(max);
      }
    }

    ticks.sort(function (a, b) {
      return a - b;
    });

    return ticks;
  }

  function createOneThreeTicks(minValue, maxValue, targetCount) {
    var min = Math.max(1e-9, minValue);
    var max = Math.max(min * 1.01, maxValue);
    var ticks = [];
    var multipliers = [1, 3];

    var minExp = Math.floor(Math.log10(min)) - 1;
    var maxExp = Math.ceil(Math.log10(max)) + 1;

    for (var exp = minExp; exp <= maxExp; exp += 1) {
      var scale = Math.pow(10, exp);
      for (var i = 0; i < multipliers.length; i += 1) {
        var tick = multipliers[i] * scale;
        if (tick >= min * 0.95 && tick <= max * 1.05) {
          ticks.push(tick);
        }
      }
    }

    ticks.sort(function (a, b) {
      return a - b;
    });

    if (ticks.length < 2) {
      ticks = [min, max];
    }

    if (ticks.length > targetCount) {
      var step = Math.ceil(ticks.length / targetCount);
      ticks = ticks.filter(function (_v, idx) {
        return idx % step === 0;
      });
      if (ticks[ticks.length - 1] < max) {
        ticks.push(max);
      }
    }

    return ticks;
  }

  function GrowthCalculator(container, options) {
    this.container = container;
    this.state = Object.assign({}, DEFAULTS, options || {});
    this.state.weeklyRevenue0 = Math.max(1 / WEEKS_PER_YEAR, this.state.weeklyRevenue0);
    this.state.weeklyFixedExpenses = Math.max(0, this.state.weeklyFixedExpenses);
    this.state.grossMargin = clamp(this.state.grossMargin, 0, 1);
    this.state.weeklyGrowthRate = clamp(this.state.weeklyGrowthRate, -0.9, 10);
    this.state.units = isValidUnit(this.state.units) ? this.state.units : 'year';

    this.drag = null;
    this.nodes = {};

    this._injectStyles();
    this._build();
    this._bind();
    this.render();
  }

  GrowthCalculator.prototype._injectStyles = function () {
    if (document.getElementById('igc-styles')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'igc-styles';
    style.textContent = '' +
      '.igc{font-family:Inter,Segoe UI,Arial,sans-serif;color:' + COLORS.black + ';width:100%;}' +
      '.igc *{box-sizing:border-box;}' +
      '.igc__radios{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:20px;font-size:14px;}' +
      '.igc__radio{display:flex;gap:8px;align-items:center;color:' + COLORS.black + ';cursor:pointer;}' +
      '.igc__radio input{accent-color:' + COLORS.blue + ';}' +
      '.igc__chart-wrap{border-radius:8px;background:#fff;}' +
      '.igc__summary{display:flex;gap:32px;flex-wrap:wrap;margin-top:16px;align-items:baseline;}' +
      '.igc__summary-label{font-size:28px;color:' + COLORS.darkGrey + ';line-height:1.4;}' +
      '.igc__summary-value{font-size:31px;font-weight:600;color:' + COLORS.black + ';line-height:1.4;margin-left:8px;}' +
      '.igc__inputs{display:flex;gap:24px;flex-wrap:wrap;margin-top:20px;}' +
      '.igc__field{min-width:220px;flex:1 1 220px;max-width:360px;}' +
      '.igc__field-label{font-size:12px;color:' + COLORS.darkGrey + ';line-height:1.4;margin-bottom:6px;display:block;}' +
      '.igc__input{width:100%;height:48px;border:1px solid ' + COLORS.grey + ';border-radius:4px;padding:10px 14px;font-size:16px;line-height:1.4;color:' + COLORS.black + ';}' +
      '.igc__input:focus{outline:2px solid rgba(14,100,224,.25);border-color:' + COLORS.blue + ';}' +
      '.igc__hint{font-size:12px;color:' + COLORS.darkGrey + ';margin-top:8px;}' +
      '@media (max-width: 880px){' +
      '.igc__summary-label{font-size:20px;}.igc__summary-value{font-size:24px;}.igc__field{max-width:none;}' +
      '}';

    document.head.appendChild(style);
  };

  GrowthCalculator.prototype._build = function () {
    this.container.innerHTML = '';

    var root = document.createElement('div');
    root.className = 'igc';

    var radios = document.createElement('div');
    radios.className = 'igc__radios';

    var units = [
      { id: 'week', label: 'Weekly' },
      { id: 'month', label: 'Monthly' },
      { id: 'quarter', label: 'Quarterly' },
      { id: 'year', label: 'Yearly' }
    ];

    var self = this;
    var unitRadioGroupName = 'igc-units-' + String(Math.random()).slice(2);
    units.forEach(function (unit) {
      var label = document.createElement('label');
      label.className = 'igc__radio';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = unitRadioGroupName;
      input.value = unit.id;
      if (unit.id === self.state.units) {
        input.checked = true;
      }

      var text = document.createElement('span');
      text.textContent = unit.label;

      label.appendChild(input);
      label.appendChild(text);
      radios.appendChild(label);
    });

    var chartWrap = document.createElement('div');
    chartWrap.className = 'igc__chart-wrap';

    var svg = createSvgEl('svg');
    setAttrs(svg, {
      viewBox: '0 0 1224 420',
      width: '100%',
      height: '420',
      preserveAspectRatio: 'none'
    });

    chartWrap.appendChild(svg);

    var summary = document.createElement('div');
    summary.className = 'igc__summary';
    summary.innerHTML = '' +
      '<div><span class="igc__summary-label">Profitable at:</span><span class="igc__summary-value" data-key="breakeven">-</span></div>' +
      '<div><span class="igc__summary-label">$1B/y revenue at:</span><span class="igc__summary-value" data-key="billion">-</span></div>';

    var inputs = document.createElement('div');
    inputs.className = 'igc__inputs';
    inputs.innerHTML = '' +
      '<div class="igc__field"><label class="igc__field-label">Revenue</label><input class="igc__input" data-key="revenue" type="text" /></div>' +
      '<div class="igc__field"><label class="igc__field-label">Gross margin</label><input class="igc__input" data-key="grossMargin" type="text" /></div>' +
      '<div class="igc__field"><label class="igc__field-label">Fixed expenses</label><input class="igc__input" data-key="fixed" type="text" /></div>' +
      '<div class="igc__field"><label class="igc__field-label">Growth rate</label><input class="igc__input" data-key="growth" type="text" /></div>';

    var hint = document.createElement('div');
    hint.className = 'igc__hint';
    hint.textContent = 'Drag handles on the chart or edit inputs.';

    root.appendChild(radios);
    root.appendChild(chartWrap);
    root.appendChild(summary);
    root.appendChild(inputs);
    root.appendChild(hint);

    this.container.appendChild(root);

    this.nodes.root = root;
    this.nodes.radios = radios;
    this.nodes.svg = svg;
    this.nodes.summaryBreakeven = summary.querySelector('[data-key="breakeven"]');
    this.nodes.summaryBillion = summary.querySelector('[data-key="billion"]');
    this.nodes.inputRevenue = inputs.querySelector('[data-key="revenue"]');
    this.nodes.inputGrossMargin = inputs.querySelector('[data-key="grossMargin"]');
    this.nodes.inputFixed = inputs.querySelector('[data-key="fixed"]');
    this.nodes.inputGrowth = inputs.querySelector('[data-key="growth"]');

    this._setupSvgLayers();
  };

  GrowthCalculator.prototype._setupSvgLayers = function () {
    var svg = this.nodes.svg;
    svg.innerHTML = '';

    var groups = {
      grid: createSvgEl('g'),
      axes: createSvgEl('g'),
      lines: createSvgEl('g'),
      labels: createSvgEl('g'),
      handles: createSvgEl('g')
    };

    Object.keys(groups).forEach(function (key) {
      svg.appendChild(groups[key]);
    });

    this.nodes.svgGroups = groups;
    this.chart = {
      width: 1224,
      height: 420,
      paddingLeft: 66,
      paddingRight: 72,
      paddingTop: 20,
      paddingBottom: 48,
      tMin: this.state.yearsMin,
      tMax: this.state.yearsMax,
      yMin: 1000 / WEEKS_PER_YEAR,
      yMax: 1000000 / WEEKS_PER_YEAR,
      ticksY: [],
      yDomainFrozen: false
    };
  };

  GrowthCalculator.prototype._bind = function () {
    var self = this;

    this.nodes.radios.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) {
          self.state.units = radio.value;
          self.render();
        }
      });
    });

    function bindInput(input, onApply) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          input.blur();
        }
      });

      input.addEventListener('blur', function () {
        onApply(input.value);
        self.render();
      });
    }

    bindInput(this.nodes.inputRevenue, function (text) {
      var displayValue = parseMoney(text);
      if (!isFiniteNumber(displayValue)) {
        return;
      }

      self.state.weeklyRevenue0 = clamp(flowToWeekly(displayValue, self.state.units), 1 / WEEKS_PER_YEAR, 1e12);
    });

    bindInput(this.nodes.inputGrossMargin, function (text) {
      var value = parsePercent(text);
      if (!isFiniteNumber(value)) {
        return;
      }
      self.state.grossMargin = clamp(value, 0, 1);
    });

    bindInput(this.nodes.inputFixed, function (text) {
      var displayValue = parseMoney(text);
      if (!isFiniteNumber(displayValue)) {
        return;
      }

      self.state.weeklyFixedExpenses = clamp(flowToWeekly(displayValue, self.state.units), 0, 1e12);
    });

    bindInput(this.nodes.inputGrowth, function (text) {
      var displayValue = parsePercent(text);
      if (!isFiniteNumber(displayValue) || displayValue <= -0.99) {
        return;
      }

      self.state.weeklyGrowthRate = clamp(growthToWeekly(displayValue, self.state.units), -0.9, 10);
    });

    this.nodes.svg.addEventListener('pointerdown', function (event) {
      var target = event.target;
      if (!target || !target.dataset || !target.dataset.handle) {
        return;
      }

      self.drag = { handle: target.dataset.handle };
      self.nodes.svg.setPointerCapture(event.pointerId);
    });

    this.nodes.svg.addEventListener('pointermove', function (event) {
      if (!self.drag) {
        return;
      }
      self._handleDrag(event);
      self.render();
    });

    function endDrag(event) {
      if (!self.drag) {
        return;
      }
      self.drag = null;
      if (self.nodes.svg.hasPointerCapture(event.pointerId)) {
        self.nodes.svg.releasePointerCapture(event.pointerId);
      }
    }

    this.nodes.svg.addEventListener('pointerup', endDrag);
    this.nodes.svg.addEventListener('pointercancel', endDrag);
  };

  GrowthCalculator.prototype._handleDrag = function (event) {
    var coords = this._eventToChart(event);
    var t = this._xToTime(coords.x);
    var value = this._yToValue(coords.y);

    var tMax = this.chart.tMax - this.chart.tMin;

    if (this.drag.handle === 'revenue-start') {
      this.state.weeklyRevenue0 = clamp(value, 1 / WEEKS_PER_YEAR, 1e12);
      return;
    }

    if (this.drag.handle === 'growth') {
      var anchorT = clamp(t, 0.75, tMax);
      var anchorWeeks = anchorT * WEEKS_PER_YEAR;
      var ratio = clamp(value / this.state.weeklyRevenue0, 1e-6, 1e9);
      var weeklyGrowth = Math.pow(ratio, 1 / anchorWeeks) - 1;
      this.state.weeklyGrowthRate = clamp(weeklyGrowth, -0.9, 10);
      return;
    }

    if (this.drag.handle === 'fixed') {
      this.state.weeklyFixedExpenses = clamp(value, 0, 1e12);
      return;
    }

    if (this.drag.handle === 'variable') {
      var revAtEnd = this._revenueAt(tMax);
      if (revAtEnd <= 0) {
        return;
      }
      var variableRatio = clamp(value / revAtEnd, 0, 1);
      this.state.grossMargin = clamp(1 - variableRatio, 0, 1);
    }
  };

  GrowthCalculator.prototype._eventToChart = function (event) {
    var rect = this.nodes.svg.getBoundingClientRect();
    var scaleX = this.chart.width / rect.width;
    var scaleY = this.chart.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  GrowthCalculator.prototype._revenueAt = function (tYearsFromStart) {
    var weeks = tYearsFromStart * WEEKS_PER_YEAR;
    return this.state.weeklyRevenue0 * Math.pow(1 + this.state.weeklyGrowthRate, weeks);
  };

  GrowthCalculator.prototype._variableAt = function (tYearsFromStart) {
    return this._revenueAt(tYearsFromStart) * (1 - this.state.grossMargin);
  };

  GrowthCalculator.prototype._totalAt = function (tYearsFromStart) {
    return this._variableAt(tYearsFromStart) + this.state.weeklyFixedExpenses;
  };

  GrowthCalculator.prototype._computeMetrics = function () {
    var contributionPct = this.state.grossMargin;
    var rev0 = this.state.weeklyRevenue0;
    var fixed = this.state.weeklyFixedExpenses;
    var growth = this.state.weeklyGrowthRate;

    var breakevenYears = null;

    if (contributionPct > 0 && rev0 * contributionPct >= fixed) {
      breakevenYears = 0;
    } else if (contributionPct > 0 && growth > 0 && rev0 > 0 && fixed > 0) {
      var numerator = Math.log(fixed / (rev0 * contributionPct));
      var denominator = Math.log(1 + growth);
      var solvedWeeks = numerator / denominator;
      if (isFiniteNumber(solvedWeeks) && solvedWeeks >= 0) {
        breakevenYears = solvedWeeks / WEEKS_PER_YEAR;
      }
    }

    var billionYears = null;
    var weeklyBillionTarget = 1e9 / WEEKS_PER_YEAR;
    if (rev0 >= weeklyBillionTarget) {
      billionYears = 0;
    } else if (growth > 0 && rev0 > 0) {
      var solvedBillionWeeks = Math.log(weeklyBillionTarget / rev0) / Math.log(1 + growth);
      if (isFiniteNumber(solvedBillionWeeks) && solvedBillionWeeks >= 0) {
        billionYears = solvedBillionWeeks / WEEKS_PER_YEAR;
      }
    }

    return {
      breakevenYears: breakevenYears,
      billionYears: billionYears
    };
  };

  GrowthCalculator.prototype._formatTime = function (yearsValue) {
    if (!isFiniteNumber(yearsValue)) {
      return 'never';
    }

    return 'year ' + yearsValue.toFixed(yearsValue < 10 ? 1 : 0);
  };

  GrowthCalculator.prototype._updateInputs = function () {
    this.nodes.inputRevenue.value = formatInputMoney(flowFromWeekly(this.state.weeklyRevenue0, this.state.units));
    this.nodes.inputGrossMargin.value = formatInputPercent(this.state.grossMargin);
    this.nodes.inputFixed.value = formatInputMoney(flowFromWeekly(this.state.weeklyFixedExpenses, this.state.units));

    var displayGrowth = growthFromWeekly(this.state.weeklyGrowthRate, this.state.units);
    this.nodes.inputGrowth.value = formatInputPercent(displayGrowth);

    this.nodes.radios.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.checked = radio.value === this.state.units;
    }, this);
  };

  GrowthCalculator.prototype._updateYDomain = function () {
    var tMax = this.chart.tMax - this.chart.tMin;
    var values = [
      this._revenueAt(0),
      this._revenueAt(tMax),
      this._variableAt(0),
      this._variableAt(tMax),
      this.state.weeklyFixedExpenses,
      this._totalAt(0),
      this._totalAt(tMax),
      1000 / WEEKS_PER_YEAR,
      1000000 / WEEKS_PER_YEAR
    ].filter(function (value) {
      return isFiniteNumber(value) && value > 0;
    });

    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);

    var yMin = Math.max(1 / WEEKS_PER_YEAR, min * 0.7);
    var yMax = Math.max(yMin * 10, max * 1.35);

    if (!this.chart.yDomainFrozen) {
      this.chart.yMin = yMin;
      this.chart.yMax = yMax;
      this.chart.yDomainFrozen = true;
    } else {
      // Keep the scale stable while dragging; expand only when data exceeds range.
      this.chart.yMin = Math.min(this.chart.yMin, yMin);
      this.chart.yMax = Math.max(this.chart.yMax, yMax);
    }

    var displayUnit = this.state.units;
    var displayMin = flowFromWeekly(this.chart.yMin, displayUnit);
    var displayMax = flowFromWeekly(this.chart.yMax, displayUnit);
    var displayTicks = createOneThreeTicks(displayMin, displayMax, 8);
    this.chart.ticksY = displayTicks.map(function (tick) {
      return flowToWeekly(tick, displayUnit);
    });

    if (this.chart.ticksY.length < 2) {
      this.chart.ticksY = [this.chart.yMin, this.chart.yMax];
    }

    this.chart.yMin = this.chart.ticksY[0];
    this.chart.yMax = this.chart.ticksY[this.chart.ticksY.length - 1];
  };

  GrowthCalculator.prototype._xFromTime = function (tYearsFromStart) {
    var plotWidth = this.chart.width - this.chart.paddingLeft - this.chart.paddingRight;
    var totalSpan = this.chart.tMax - this.chart.tMin;
    return this.chart.paddingLeft + (tYearsFromStart / totalSpan) * plotWidth;
  };

  GrowthCalculator.prototype._xToTime = function (x) {
    var plotWidth = this.chart.width - this.chart.paddingLeft - this.chart.paddingRight;
    var clamped = clamp(x, this.chart.paddingLeft, this.chart.width - this.chart.paddingRight);
    var ratio = (clamped - this.chart.paddingLeft) / plotWidth;
    var totalSpan = this.chart.tMax - this.chart.tMin;
    return ratio * totalSpan;
  };

  GrowthCalculator.prototype._yFromValue = function (value) {
    var safeValue = clamp(value, this.chart.yMin, this.chart.yMax);
    var lnMin = Math.log(this.chart.yMin);
    var lnMax = Math.log(this.chart.yMax);
    var lnValue = Math.log(safeValue);
    var ratio = (lnValue - lnMin) / (lnMax - lnMin || 1);

    var plotHeight = this.chart.height - this.chart.paddingTop - this.chart.paddingBottom;
    return this.chart.height - this.chart.paddingBottom - ratio * plotHeight;
  };

  GrowthCalculator.prototype._yToValue = function (y) {
    var plotHeight = this.chart.height - this.chart.paddingTop - this.chart.paddingBottom;
    var clamped = clamp(y, this.chart.paddingTop, this.chart.height - this.chart.paddingBottom);
    var ratio = (this.chart.height - this.chart.paddingBottom - clamped) / plotHeight;
    var lnMin = Math.log(this.chart.yMin);
    var lnMax = Math.log(this.chart.yMax);

    return Math.exp(lnMin + ratio * (lnMax - lnMin));
  };

  GrowthCalculator.prototype._linePath = function (fn) {
    var points = [];
    var samples = 120;
    var tSpan = this.chart.tMax - this.chart.tMin;

    for (var i = 0; i <= samples; i += 1) {
      var t = (i / samples) * tSpan;
      points.push(this._xFromTime(t) + ',' + this._yFromValue(fn.call(this, t)));
    }

    return points.join(' ');
  };

  GrowthCalculator.prototype._draw = function () {
    var gGrid = this.nodes.svgGroups.grid;
    var gAxes = this.nodes.svgGroups.axes;
    var gLines = this.nodes.svgGroups.lines;
    var gLabels = this.nodes.svgGroups.labels;
    var gHandles = this.nodes.svgGroups.handles;

    gGrid.innerHTML = '';
    gAxes.innerHTML = '';
    gLines.innerHTML = '';
    gLabels.innerHTML = '';
    gHandles.innerHTML = '';

    var self = this;

    this.chart.ticksY.forEach(function (tick) {
      var y = self._yFromValue(tick);

      var line = createSvgEl('line');
      setAttrs(line, {
        x1: self.chart.paddingLeft,
        y1: y,
        x2: self.chart.width - self.chart.paddingRight,
        y2: y,
        stroke: COLORS.grid,
        'stroke-width': 1
      });
      gGrid.appendChild(line);

      var label = createSvgEl('text');
      label.textContent = formatMoney(flowFromWeekly(tick, self.state.units));
      setAttrs(label, {
        x: self.chart.paddingLeft - 10,
        y: y + 4,
        fill: COLORS.black,
        'font-size': 10,
        'font-weight': 500,
        'text-anchor': 'end'
      });
      gAxes.appendChild(label);
    });

    for (var year = this.chart.tMin; year <= this.chart.tMax; year += 1) {
      var t = year - this.chart.tMin;
      var x = this._xFromTime(t);

      var vLine = createSvgEl('line');
      setAttrs(vLine, {
        x1: x,
        y1: this.chart.paddingTop,
        x2: x,
        y2: this.chart.height - this.chart.paddingBottom,
        stroke: COLORS.grid,
        'stroke-width': 1
      });
      gGrid.appendChild(vLine);

      var xTick = createSvgEl('text');
      xTick.textContent = String(year);
      setAttrs(xTick, {
        x: x,
        y: this.chart.height - this.chart.paddingBottom + 18,
        fill: COLORS.black,
        'font-size': 10,
        'font-weight': 500,
        'text-anchor': 'middle'
      });
      gAxes.appendChild(xTick);
    }

    var axisRevenueExpense = createSvgEl('text');
    axisRevenueExpense.textContent = 'Revenue/Expense';
    setAttrs(axisRevenueExpense, {
      x: this.chart.paddingLeft,
      y: this.chart.paddingTop + 2,
      fill: COLORS.black,
      'font-size': 10,
      'font-weight': 700,
      'text-anchor': 'start'
    });
    gAxes.appendChild(axisRevenueExpense);

    var axisYears = createSvgEl('text');
    axisYears.textContent = 'Years';
    setAttrs(axisYears, {
      x: this.chart.width - this.chart.paddingRight,
      y: this.chart.height - 8,
      fill: COLORS.black,
      'font-size': 10,
      'font-weight': 700,
      'text-anchor': 'end'
    });
    gAxes.appendChild(axisYears);

    function addLine(points, stroke, width, opacity, titleText) {
      var visible = createSvgEl('polyline');
      setAttrs(visible, {
        fill: 'none',
        points: points,
        stroke: stroke,
        'stroke-width': width,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: opacity == null ? 1 : opacity,
        'pointer-events': 'none'
      });
      gLines.appendChild(visible);

      var hit = createSvgEl('polyline');
      setAttrs(hit, {
        fill: 'none',
        points: points,
        stroke: 'rgba(0,0,0,0.001)',
        'stroke-width': Math.max(14, width + 8),
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'pointer-events': 'stroke',
        style: 'cursor:help'
      });

      if (titleText) {
        var title = createSvgEl('title');
        title.textContent = titleText;
        hit.appendChild(title);
      }

      gLines.appendChild(hit);
    }

    addLine(this._linePath(this._revenueAt), COLORS.revenue, 3, 1, 'Revenue');
    addLine(this._linePath(this._variableAt), COLORS.variable, 2.5, 0.9, 'Variable expenses');
    addLine(this._linePath(function () { return this.state.weeklyFixedExpenses; }), COLORS.fixed, 2.5, 0.95, 'Fixed expenses');
    addLine(this._linePath(this._totalAt), COLORS.total, 3.5, 1, 'Total expenses');

    var tEnd = this.chart.tMax - this.chart.tMin;
    var xLabel = this._xFromTime(tEnd) + 6;

    function addLineLabel(textValue, y, color, dy) {
      var text = createSvgEl('text');
      text.textContent = textValue;
      setAttrs(text, {
        x: xLabel,
        y: y + (dy || 0),
        fill: color,
        'font-size': 10,
        'font-weight': 700,
        'text-anchor': 'start'
      });
      gLabels.appendChild(text);
    }

    addLineLabel('Revenue', this._yFromValue(this._revenueAt(tEnd)), COLORS.black, 4);
    addLineLabel('Total expenses', this._yFromValue(this._totalAt(tEnd)), COLORS.black, -6);
    addLineLabel('Fixed expenses', this._yFromValue(this.state.weeklyFixedExpenses), COLORS.black, -4);
    addLineLabel('Variable expenses', this._yFromValue(this._variableAt(tEnd)), COLORS.black, 10);

    var metrics = this._computeMetrics();
    if (isFiniteNumber(metrics.breakevenYears) && metrics.breakevenYears <= tEnd) {
      var bx = this._xFromTime(metrics.breakevenYears);
      var by = this._yFromValue(this._revenueAt(metrics.breakevenYears));

      var marker = createSvgEl('circle');
      setAttrs(marker, {
        cx: bx,
        cy: by,
        r: 4,
        fill: COLORS.white,
        stroke: COLORS.total,
        'stroke-width': 2
      });
      gLabels.appendChild(marker);
    }

    function addHandleRect(name, x, y, color) {
      var rect = createSvgEl('rect');
      setAttrs(rect, {
        x: x - 8,
        y: y - 6,
        width: 16,
        height: 12,
        rx: 2,
        fill: COLORS.white,
        stroke: color,
        'stroke-width': 2,
        'data-handle': name,
        style: 'cursor:ns-resize'
      });
      gHandles.appendChild(rect);

      var centerLine1 = createSvgEl('line');
      setAttrs(centerLine1, {
        x1: x - 4,
        y1: y - 2,
        x2: x + 4,
        y2: y - 2,
        stroke: color,
        'stroke-width': 1.5,
        'data-handle': name,
        style: 'cursor:ns-resize'
      });
      gHandles.appendChild(centerLine1);

      var centerLine2 = createSvgEl('line');
      setAttrs(centerLine2, {
        x1: x - 4,
        y1: y + 2,
        x2: x + 4,
        y2: y + 2,
        stroke: color,
        'stroke-width': 1.5,
        'data-handle': name,
        style: 'cursor:ns-resize'
      });
      gHandles.appendChild(centerLine2);
    }

    function addHandleCircle(name, x, y, color) {
      var circle = createSvgEl('circle');
      setAttrs(circle, {
        cx: x,
        cy: y,
        r: 6,
        fill: COLORS.white,
        stroke: color,
        'stroke-width': 3,
        'data-handle': name,
        style: 'cursor:move'
      });
      gHandles.appendChild(circle);
    }

    addHandleRect('revenue-start', this._xFromTime(0), this._yFromValue(this._revenueAt(0)), COLORS.revenue);
    addHandleRect('fixed', this._xFromTime(0), this._yFromValue(this.state.weeklyFixedExpenses), COLORS.fixed);
    addHandleRect('variable', this._xFromTime(tEnd), this._yFromValue(this._variableAt(tEnd)), COLORS.variable);

    var growthT = tEnd * 0.55;
    addHandleCircle('growth', this._xFromTime(growthT), this._yFromValue(this._revenueAt(growthT)), COLORS.revenue);
  };

  GrowthCalculator.prototype.render = function () {
    this._updateInputs();
    this._updateYDomain();
    this._draw();

    var metrics = this._computeMetrics();
    this.nodes.summaryBreakeven.textContent = this._formatTime(metrics.breakevenYears);
    this.nodes.summaryBillion.textContent = this._formatTime(metrics.billionYears);
  };

  function init(target, options) {
    var container = target;

    if (typeof target === 'string') {
      container = document.querySelector(target);
    }

    if (!container) {
      return null;
    }

    return new GrowthCalculator(container, options || {});
  }

  function autoInit() {
    var nodes = document.querySelectorAll('[data-ims-growth-graph], #growth-calc');
    if (!nodes.length) {
      return [];
    }

    var instances = [];
    nodes.forEach(function (node) {
      instances.push(new GrowthCalculator(node));
    });
    return instances;
  }

  window.ImsGrowthCalculator = {
    init: init,
    autoInit: autoInit
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      autoInit();
    });
  } else {
    autoInit();
  }
})();
