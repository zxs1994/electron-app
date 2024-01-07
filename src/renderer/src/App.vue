<script setup>
import Yancong from './components/Yancong.vue'
import { Table, Button, InputNumber, Form, FormItem, Descriptions, DescriptionsItem } from 'ant-design-vue'
import { ref } from 'vue'
import dayjs from 'dayjs'

const waterLevelMsg = ref('')
const getTime = ref('')
const getType = ref('')
const waterColor = ref('')
const waterHeight = ref(0)
// const inputValue = ref('')
const getLoading = ref(false)
const setTime = ref('')
const setType = ref('')
const formState = ref({
  inputValue: ''
})
const formRef = ref()
const columns = [
  {
    title: '时间段',
    dataIndex: 'time',
    // customCell: (_) => {
    //   return { rowSpan: _.rowSpan }
    // },
    align: 'center'
  },
  {
    title: '水位高度(米)',
    dataIndex: 'height'
  },
  {
    title: '灯柱颜色',
    dataIndex: 'color'
  }
]
const data = [
  {
    time: '全年',
    height: '15.23 ≤ 17',
    color: 'red',
    colorTitle: '红色'
  },
  {
    time: '全年',
    height: '14.5 ≤ 15.23',
    color: 'orange',
    colorTitle: '橙色'
  },
  {
    time: '全年',
    height: '14 ≤ 14.5',
    color: 'rgb(255,210,0)',
    colorTitle: '黄橙色',
  },
  {
    time: '5月1日-9月30日',
    height: '13.6 ≤ 14',
    color: 'yellow',
    colorTitle: '黄色',
  },
  {
    time: '10月1日-4月30日',
    height: '12.5 ≤ 14',
    color: 'yellow',
    colorTitle: '黄色',
  },
  {
    time: '5月1日-9月30日',
    height: '11.3 ≤ 13.6',
    color: 'blue',
    colorTitle: '蓝色',
  },
  {
    time: '10月1日-4月30日',
    height: '11.3 ≤ 12.5',
    color: 'blue',
    colorTitle: '蓝色',
  },
  {
    time: '全年',
    height: '11.3以下',
    color: 'purple',
    colorTitle: '紫色',
  }
]

function setWaterColor(num, type) {
  waterHeight.value = num
  setTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  setType.value = type
  const endItem = data[data.length - 1]
  const min = parseFloat(endItem.height)
  let item
  if (num <= min) {
    item = endItem
  } else {
    const month = new Date().getMonth() + 1
    item = data.find(v => {
      const numbers = v.height.split('≤').map(v => parseFloat(v))
      // console.log(numbers)
      if (num > numbers[0] && num <= numbers[1]) {
        const time = v.time
        console.log(v)
        if (v.time === '全年') {
          return true
        } else {
          const months = time.split('-').map(v => parseFloat(v))
          console.log(months)
          if (month >= months[0]) {
            if (month <= months[1] || months[0] > months[1]) {
              return true
            }
          } else if (months[0] > months[1] && month <= months[1]) {
            return true
          }
        }
      }
    })
  }
  console.log(item)
  waterColor.value = item.color
}

function getData(type = '自动-网站') {
  getLoading.value = true
  window.api.getData().then((v) => {
    // console.log(v)
    getLoading.value = false
    waterLevelMsg.value = v
    getTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
    getType.value = type
    const h = waterLevelMsg.value.num
    // const h = 17
    setWaterColor(h, type)
    formRef.value.resetFields()
  })
}
getData()

window.api.onTimedTask((value) => {
  console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'))
  const theDay = dayjs().format('YYYY-MM-DD')
  const thatDay = waterLevelMsg.value.time ? dayjs(waterLevelMsg.value.time).format('YYYY-MM-DD') : undefined
  if (theDay !== thatDay) {
    const theHour = new Date().getHours()
    if (theHour >= 8) {
      getData()
    }
  }
})


const onFinish = values => {
  console.log('Success:', values)
  setWaterColor(formState.value.inputValue, '手动-输入')
}
const onFinishFailed = errorInfo => {
  console.log('Failed:', errorInfo)
}

const validator = (rule, value) => {
  return new Promise((resolve, reject) => {
    if (value) {
      if (value < 8 || value > 17) {
        reject('请输入8-17')
      } else {
        resolve()
      }
    } else {
      reject('请输入水位')
    }
  })
}

const onKeyup = () => {
  if (!formState.value.inputValue) {
    formRef.value.clearValidate()
  }
}

</script>

<template>
  <div class="main">
    <div style="width: 470px; margin-right: 100px;">
      <Descriptions size="small" :column="2">
      <template #title>
        <Button @click="getData('手动-网站')" type="primary" :loading="getLoading">立即获取</Button>
      </template>
      <DescriptionsItem label="获取方式">{{ getType }}</DescriptionsItem>
      <DescriptionsItem label="获取时间">{{ getTime }}</DescriptionsItem>
      <DescriptionsItem label="网站发布时间">{{ waterLevelMsg.time }}</DescriptionsItem>
      <DescriptionsItem label="洪泽湖水位">{{ waterLevelMsg.num }}</DescriptionsItem>
      <DescriptionsItem label="设置方式">{{ setType }}</DescriptionsItem>
      <DescriptionsItem label="设置时间">{{ setTime }}</DescriptionsItem>
      <DescriptionsItem :span="2">
        <Form
          ref="formRef"
          labelAlign="left"
          :model="formState"
          @finish="onFinish"
          @finishFailed="onFinishFailed">
          <FormItem
            label="手动输入:"
            name="inputValue"
            :rules="{ validator, }">
            <InputNumber
              v-model:value="formState.inputValue"
              addon-after="米"
              @keyup="onKeyup"
              @keydown.enter="onFinish"
            />
            <Button type="primary" ghost html-type="submit" style="margin-left: 15px;">确定</Button>
          </FormItem>
        </Form>
      </DescriptionsItem>
      <DescriptionsItem label="">
        <Table
          :columns="columns"
          :data-source="data"
          bordered
          :pagination="false"
          size="small"
          style="width: 100%;">
          <template #title>水柱颜色设置规则</template>
          <template #bodyCell="{column, value, record}">
            <template v-if="column.dataIndex === 'color'">
              <div :style="{background: value}">{{ record.colorTitle }}</div>
            </template>
          </template>
        </Table>
      </DescriptionsItem>
    </Descriptions>
      
    </div>
    <Yancong :waterColor="waterColor" :waterHeight="waterHeight"></Yancong>
  </div>
</template>

<style lang="less">
@import url('assets/css/styles.less');
.main {
  // flex: 1;
  display: flex;
  // flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  max-width: 840px;
  margin: 0 auto;
  padding: 30px;
}
</style>
