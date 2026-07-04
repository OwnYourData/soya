<template>
  <div>
    <b-form>
      <b-input-group prepend="Scale X">
        <b-form-input v-model="scaleXExpression"></b-form-input>
      </b-input-group>

      <b-input-group
        :prepend="`Data ${idx+1}`"
        v-for="(row, idx) of rows"
        :key="idx"
      >
        <b-form-input v-model="row.expression"></b-form-input>
        <b-input-group-append>
          <b-button
            @click="addRow(idx)"
            variant="success"
          >+</b-button>
          <b-button
            :disabled="!canRemoveRow"
            @click="removeRow(idx)"
            :variant="canRemoveRow ? 'danger' : ''"
          >-</b-button>
        </b-input-group-append>
      </b-input-group>

      <b-button @click="computeChartData">
        Update Chart
      </b-button>

      <div class="mt-3">
        <slot />
      </div>
    </b-form>
    <zingchart
      v-if="chartData"
      :data="chartData"
    >
    </zingchart>
  </div>
</template>

<script lang="ts">
import { SemconItem } from "semcon-js";
import Vue, { PropType } from "vue";
import 'zingchart/es6';
//@ts-expect-error zingchart-vue does not have types
import zingchartVue from 'zingchart-vue';
import { Evaluator } from '../utils/evaluator';

interface Row {
  expression: string;
}

interface Scale {
  labels: string[],
}

interface ChartData {
  scaleX: Scale,
  type: string
  series: {
    values: any[],
  }[],
}

interface Data {
  rows: Row[],
  labels: string[],
  scaleXExpression: string,
  chartData: ChartData | undefined,
}

export default Vue.extend({
  components: {
    zingchart: zingchartVue,
  },
  props: {
    items: Array as PropType<SemconItem[]>,
  },
  data: (): Data => ({
    rows: [{ expression: '' }],
    labels: [],
    scaleXExpression: '',
    chartData: undefined,
  }),
  computed: {
    canRemoveRow() {
      return this.rows.length > 1;
    },
  },
  methods: {
    addRow(idx: number) {
      this.rows.splice(idx + 1, 0, {
        expression: '',
      })
    },
    removeRow(idx: number) {
      this.rows.splice(idx, 1);
    },
    computeChartData(): ChartData | undefined {
      if (!this.items || this.items.length === 0)
        return;

      const data: ChartData = {
        type: 'area',
        scaleX: {
          labels: [],
        },
        series: [],
      }

      for (let j = 0, size = this.rows.length; j < size; j++) {
        const row = this.rows[j];

        if (!row.expression)
          continue;

        const series: any[] = [];

        for (let i = 0, size = this.items.length; i < size; i++) {
          const item = this.items[i];

          // only in first loop we populate labels
          if (j === 0) {
            data.scaleX.labels.push(Evaluator.evalTypeAgnostic(this.scaleXExpression, item) || (i + 1));
          }

          const value = Evaluator.evalTypeAgnostic(row.expression, item);

          if (value !== undefined && value !== null) {
            series.push(value);
          }
        }

        data.series.push({ values: series });
      }

      this.chartData = data.series.length === 0 ? undefined : data;
        return;
    },
  },
});
</script>

<style>
</style>