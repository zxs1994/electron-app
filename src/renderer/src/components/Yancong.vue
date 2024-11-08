<script setup>
import { Tooltip } from 'ant-design-vue'
// import { QuestionCircleOutlined } from '@ant-design/icons-vue'

const numbers = [17, 16.25, 16, 15.23, 15, 14.5, 14, 13.6, 13, 12.5, 12, 11.3, 11, 10.2, 10, 9, 8]
const numberTooltip = {
  16.25: '洪泽湖历史最高水位',
  15.23: '建国后洪泽湖最高水位',
  14.5: '蓄滞洪区启用水位',
  13.6: '洪泽湖汛期警戒水位',
  12.5: '洪泽湖非汛期警戒水位',
  11.3: '洪泽湖死水位',
  10.2: '洪泽湖附近湖底高程'
}

const props = defineProps(['waterColor', 'waterHeight'])
</script>
<template>
  <div class="yancong">
    <div class="line-box">
      <div class="line" v-for="i in 9 * 4 + 1" :key="i"></div>
    </div>
    <div class="pillar">
      <div class="water" :style="{
        background: props.waterColor,
        height: (1 - (17 - props.waterHeight) / 9) * 100 + '%'
      }"></div>
    </div>
    <div class="numbers-box">
      <div
        class="numbers"
        v-for="num in numbers"
        :key="num"
        :style="{
          color: num % 1 === 0 ? 'green' : 'red',
          top: ((17 - num) / 9) * 100 + '%'
        }"
      >
        <span v-if="num % 1 === 0">{{ num }}</span>
        <Tooltip placement="rightTop" v-else>
          <template #title>
            <span>{{ numberTooltip[num] }}</span>
          </template>
          <span style="cursor: pointer">{{ num }}</span>
        </Tooltip>
      </div>
    </div>
  </div>
</template>
<style lang="less">
.yancong {
  display: flex;
  height: 742px;
  // transform: rotateX(25deg);
  // transform-origin: bottom center;
  // transform: perspective(2000px) rotateX(30deg);
  .line-box {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    .line {
      height: 3px;
      width: 20px;
      background: blue;
      // margin-bottom: 25px;
      &:nth-of-type(2n + 1) {
        width: 40px;
      }
      &:nth-of-type(4n + 1),
      &:first-child {
        width: 60px;
      }
      // &:last-child {
      //   margin-bottom: 0px;
      // }
    }
  }
  .pillar {
    width: 30px;
    height: 100%;
    // border: 1px solid #ccc;
    display: flex;
    flex-direction: column-reverse;
    background: #000000c6;
    .water {
      // height: 200px;
      // background: yellow;
      transition: all 1.5s;
    }
  }
  .numbers-box {
    height: 100%;
    position: relative;
    width: 50px;
    text-align: center;
    .numbers {
      transform: translateY(-50%);
      position: absolute;
      width: 100%;
      font-size: 16px;
      font-weight: 600;
    }
  }
}
</style>
