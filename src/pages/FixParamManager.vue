<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import apiClient from '@/layout/composables/apiClientConfigure'
import APICallService from '@/service/APICallService'

import {
  trimUnicodeAndWhiteSpaces,
  incrementNumber,
  getDailyNumber,
  parseJsonData,
} from '@/layout/utils/CustomUtils'

import {
  addDataToIndexedDB,
  getAllDataFromIndexedDB,
  clearObjectStore,
  getDataFromIndexedDB,
  removeDataFromIndexedDB,
  openDatabase,
  upgradeFixParamDB,
} from '@/layout/utils/IndexedDB.js'

import { useToastNotification } from '@/layout/composables/useToastNotification'
const { alertSuccess, alertError, alertInfo, alertWarning } = useToastNotification()

//const router = useRouter()
const currentUser = localStorage.getItem('employeeId')
const FixParamDB = 'FixParamDB'
const objStoreSheet = 'sheets'
const objStoreFixLog = 'issueFixLog'
const objStoreTicket = 'helpDeskTicket'
const objStoreNumber = 'dailyBatchNumber'
//const file = ref(null)
const fileUpload = ref(null)
const fileName = ref('')
const fileNameload = ref(false)
const displayConfirmation = ref(false)
const fileUrl = '/public/templates/Sample_Template.xlsx'
const fileDownloadName = 'Sample_Template_Fix.xlsx'
const dataFileValue = ref([])

const isModalOpen = ref(false)
const sheetPreviewTable = ref([])

const sheetIdList = ref('')
const submitted = ref(true)

//Computed for DataTable columns and rows
const tableColumns = computed(() => {
  if (!sheetPreviewTable.value.length) return []
  return sheetPreviewTable.value[0].map((col, index) => ({
    field: `col${index}`,
    header: col,
  }))

})

const tableRows = computed(() => {
  return sheetPreviewTable.value.slice(1).map((row, rowIndex) => {
    const rowObj = {
      index: rowIndex + 1, // Add "Row #" column
    }
    row.forEach((cell, index) => {
      rowObj[`col${index}`] = cell
    })
    return rowObj
  })
})

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function triggerFileInput() {
  fileUpload.value.click()
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) fileName.value = file.name
}

watch(
 fileName, ()=> { fileNameload.value=false }
)

async function handleUpload() {
  const selectedFile = fileUpload.value?.files[0]

  if (!selectedFile) {
    alertError('Error', 'Please select a file first.')
    fileNameload.value=true
    return
  }

  fnFileUploadList(selectedFile)
  alertSuccess('Success', `Success upload ${ fileName.value }`)
  fileName.value = ''
  fileUpload.value.value = ''
}

function downloadTemplate() {
  displayConfirmation.value = true
}

function confirmDownload() {
  const a = document.createElement('a')
  a.href = fileUrl
  a.download = fileDownloadName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  displayConfirmation.value = false
}

function closeConfirmation() {
  displayConfirmation.value = false
}

async function fnFileUploadList(file) {

  const reader = new FileReader()

  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      const json = trimUnicodeAndWhiteSpaces(jsonData)

      if (json.length <= 1) continue

      const currentDate = dayjs().format('DD/MM/YYYY')
      const headers = json[0]

      const createdDateIndex = headers.indexOf('CREATED_DATE')
      const eTicketIndex = headers.indexOf('E_TICKET_NO')
      const makerIndex = headers.includes('USER_MAKER')
        ? headers.indexOf('USER_MAKER')
        : headers.push('USER_MAKER') - 1
      const batchNoIndex = headers.indexOf('FIX_BATCH_NO')

      const firstETicket = json[1][eTicketIndex]?.trim()
      const dailyBatch = await getDailyNumber(FixParamDB)
      const dailyBatchNo = `${dayjs().format('YYYYMMDD')}-${dailyBatch}`

      for (let i = 1; i < json.length; i++) {
        headers.forEach((_, l) => {
          json[i][l] = json[i][l] === undefined ? null : json[i][l]
        })
        json[i][createdDateIndex] = currentDate
        json[i][batchNoIndex] = dailyBatchNo
        json[i][makerIndex] = currentUser
      }

      const sheetId = await incrementNumber(FixParamDB, 'sheets')
      const sheetData = {
        id: sheetId,
        data: json,
        helpDesk_ticket_no: firstETicket,
        listing_issue_fix_id: sheetName,
        batch_no: dailyBatchNo,
      }

      await addDataToIndexedDB(FixParamDB, 'sheets', sheetData)
    }
    await loadExistingData(dataFileValue.value)
  }
  reader.readAsArrayBuffer(file)
}
import { useLayout } from '@/layout/composables/layout'
const layoutConfig = useLayout()
async function loadExistingData(dataFileValueRef) {
  layoutConfig.isSpinnerLoading.isLoading = true
  const existingData = await getAllDataFromIndexedDB(FixParamDB, objStoreSheet)
  dataFileValueRef.value = existingData.map((sheetData, i) => ({
    index: i + 1,
    id: sheetData.id,
    batch_no: sheetData.batch_no,
    ticket: sheetData.helpDesk_ticket_no,
    sheet_name: sheetData.listing_issue_fix_id,
  }))
  layoutConfig.isSpinnerLoading.isLoading = false
}

function populateDataTable(sheetData) {
  return sheetData
}

async function fnViewFile(sheetId, sheet_name) {
  sheetIdList.value = sheet_name

  const sheetData = await getDataFromIndexedDB(FixParamDB, objStoreSheet, sheetId)
  console.log('sheetData1', sheetData)
  if (sheetData) {
    const parsed = populateDataTable(sheetData.data)
    sheetPreviewTable.value = parsed
    await openModal()
  } else {
    alertError('File not found.')
  }
}

// Remove file
async function fnRemoveFile(sheetId) {
  if (confirm('Are you sure you want to delete this file?')) {
    await removeDataFromIndexedDB(FixParamDB, objStoreSheet, sheetId)
    await loadExistingData(dataFileValue.value)
  }
}

async function clearData(dataFileValueRef) {
  clearObjectStore(FixParamDB, objStoreSheet)
  await this.loadExistingData(dataFileValueRef)
}
async function saveProcessFixing() {
  const allSheets = await getAllDataFromIndexedDB(FixParamDB, 'sheets')
  const tickets = await getAllDataFromIndexedDB(FixParamDB, 'helpDeskTicket')

  // confirm.require({
  //   message: `There are ${allSheets.length} request(s) to process. Are you sure?`,
  //   header: 'Confirm Processing',
  //   icon: 'pi pi-exclamation-triangle',
  //   acceptLabel: 'Yes',
  //   rejectLabel: 'No',

  // })
  for (const sheetData of allSheets) {
    const fixTypeName = sheetData.listing_issue_fix_id
    const sheetID = sheetData.id
    const headers = sheetData.data[0]

    const jsonArray = sheetData.data.slice(1).map((row) => {
      const rowObj = {}
      headers.forEach((header, i) => {
        rowObj[header] = row[i] ?? null
      })
      return rowObj
    })

    const eTicketNo = jsonArray[0].E_TICKET_NO
    let matchingTicket = null

    for (const ticket of tickets) {
      matchingTicket = ticket.data.find((item) => item.REQ_TKT_NO === eTicketNo)
      if (matchingTicket) break
    }

    if (!matchingTicket) {
      alertError(
        `Error: Message on ${fixTypeName}`,
        `This Ticket ${eTicketNo} is invalid in Help Desk System`,
      )
      continue
    }

    if (matchingTicket.COMPLETED !== 'Y') {
      alertWarning(`Error Message on ${fixTypeName}`, `Ticket ${eTicketNo} not yet approved`)
      continue
    }
    await fnSaveFix(fixTypeName, JSON.stringify(headers), JSON.stringify(jsonArray), sheetID)
  }
}

// Call fix API
async function fnSaveFix(fix_type, jsonString1, jsonString2, sheetId) {
  const data = {
    catalogName: 'dba_pkg',
    procOrFuncName: 'pro_exec_fix',
    inputParam: [
      { name: 'p_userid', data: currentUser },
      { name: 'fix_type', data: fix_type },
      { name: 'jsondata1', data: jsonString1 },
      { name: 'jsondata2', data: jsonString2 },
    ],
  }

  try {
    const response = await APICallService.v_api_call(data)
    const { status, messages } = response.data.data
    if (status === '1') {
      alertInfo('Message Success', messages)
      removeDataFromIndexedDB(FixParamDB, objStoreSheet, sheetId)
      // loadExistingData();
      // loadFixLog(fix_type);
    } else {
      alertError('Message Error', messages)
    }
  } catch (error) {
    console.error('Error fetching ticket:', error)
  }
}

async function fnGetTicket() {
  const requestData = {
    catalogName: 'DBA_PKG',
    procOrFuncName: 'fn_get_tkt_no',
    inputParam: [],
  }
  try {
    const response = await APICallService.v_api_call(requestData)
    await fnGetTicketCallBack(response)
  } catch (error) {
    console.error('Error fetching ticket:', error)
  }
}

async function fnGetTicketCallBack(response) {
  const json = response.data.data.return
  // Use a proper numeric ID (you had `id_no = "1"; id: id_no++` which is string incrementing)
  const id_no = 1
  const sheetData = {
    id: id_no,
    data: json,
  }
  await clearObjectStore(FixParamDB, objStoreTicket)
  await addDataToIndexedDB(FixParamDB, objStoreTicket, sheetData)
}

// eslint-disable-next-line no-unused-vars
function fnGetIssueType() {
  const data = {
    catalogName: 'DBA_PKG',
    procOrFuncName: 'fn_get_issue_type',
    inputParam: [],
  }
  apiClient(APICallService.v_api_call, data)
}

const dateRange = ref(null) // this will be an array: [startDate, endDate]

function downloadFromRef(sheetPreviewTableRef, modalTitle) {
  const data = sheetPreviewTableRef

  if (!data || !Array.isArray(data) || data.length === 0) {
    alert('No data to download.')
    return
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, modalTitle)
  XLSX.writeFile(wb, `${modalTitle}.xlsx`)
}

async function loadFixLog() {
  if (!dateRange.value || dateRange.value.length < 2) {
    alert('Please select a valid date range.')
    return
  }

  const [start_date, end_date] = dateRange.value.map((date) =>
    dayjs(date).format('DD-MMM-YYYY').toUpperCase(),
  )
  var issue_type = 'FIX CO-SIGNER'
  const data = {
    catalogName: 'DBA_PKG',
    procOrFuncName: 'fn_get_fix_log',
    inputParam: [
      { name: 'p_userid', data: currentUser },
      { name: 'p_issue_type', data: issue_type },
      { name: 'start_date', data: start_date },
      { name: 'end_date', data: end_date },
    ],
  }
  await clearObjectStore(FixParamDB, 'issueFixLog')
  try {
    const response = await APICallService.v_api_call(data)
    await loadFixLogCallBack(response)
  } catch (error) {
    console.error('Error load fix log:', error)
  }
}

async function loadFixLogCallBack(data) {
  const logData = data.data.data.return
  for (const row of logData) {
    const jsonData1 = parseJsonData(row.JSON_DATA1)
    const jsonData2 = parseJsonData(row.JSON_DATA2)
    const logItem = {
      id: row.FIX_BATCH_NO, // ensure unique ID
      batch_no: row.FIX_BATCH_NO,
      tkt_no: row.E_TICKET_NO,
      fix_type: row.FIX_TYPE,
      completed_date: row.COMPLETED_DATE,
      status: row.COMPLETED_STATE,
      error_state: row.ERROR_STATE,
      data1: jsonData1,
      data2: jsonData2,
    }

    await addDataToIndexedDB(FixParamDB, 'issueFixLog', logItem)
  }

  await loadFixLogData()
}

const logValue = ref([])
async function loadFixLogData() {
  const existingData = await getAllDataFromIndexedDB(FixParamDB, 'issueFixLog')
  console.log('existingData', existingData)
  logValue.value = existingData.map((logData, i) => ({
    index: i + 1,
    ...logData,
  }))
  layoutConfig.isSpinnerLoading.isLoading = false
}

async function viewLogDetail(id, sheet_name, mode) {
  sheetIdList.value = sheet_name
  const sheetData = await getDataFromIndexedDB(FixParamDB, objStoreFixLog, id)
  let listData = mode === 1 ? sheetData.data1 : sheetData.data2
  const parsed = populateDataTable(listData)
  sheetPreviewTable.value = parsed
  openModal()
}

onMounted(async () => {
  openDatabase(FixParamDB, 1, upgradeFixParamDB)
  await loadExistingData(dataFileValue.value)
  fnGetTicket()
})
</script>

<template>
  <div class="card flex flex-col gap-4 w-full">
    <h2 class="font-semibold text-xl">Operation</h2>
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex flex-wrap gap-2 w-full">
        <label>File input</label>
        <InputGroup>
          <inputText
            type="text"
            :value="fileName"
            v-model="fileName"
            placeholder="Choose file"
            @click="triggerFileInput"
            :invalid="fileNameload"
          />
          <input
            ref="fileUpload"
            type="file"
            accept=".xlsx, .xls"
            style="display: none"
            @change="handleFileChange"
          />
          <Button type="button" @click="handleUpload" label="Upload" />
        </InputGroup>
        <Message v-if="fileNameload" severity="error" variant="simple" size="small">
            Please input file
        </Message>
      </div>
    </div>
    <Button
      label="Sample Template"
      icon="pi pi-download"
      severity="secondary"
      style="width: 200px"
      @click="downloadTemplate"
    />
    <DataTable
      :value="dataFileValue.value"
      responsiveLayout="scroll"
      showGridlines
      tableStyle="min-width: 50rem"
      paginator
      :rows="5"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      class="text-sm"
    >
      <Column
        headerStyle="item-align: center"
        header="#"
        field="index"
        style="width: 50px; text-align: center"
      />
      <Column field="batch_no" header="Batch No" />
      <Column field="ticket" header="Ticket" />
      <Column field="sheet_name" header="Sheet Name" />
      <Column header="Action" style="width: 175px; text-align: center">
        <template #body="slotProps">
          <Button
            icon="pi pi-eye"
            label="View"
            class="p-button-sm p-button-primary mr-1"
            @click="fnViewFile(slotProps.data.id, slotProps.data.sheet_name)"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-sm p-button-danger"
            @click="fnRemoveFile(slotProps.data.id)"
          />
        </template>
      </Column>
    </DataTable>
    <div class="flex flex-wrap gap-2">
      <Button
        style="width: auto"
        icon="pi pi-refresh"
        @click="loadExistingData(dataFileValue)"
        label="Refresh"
        severity="primary"
      ></Button>
      <Button
        style="width: auto"
        icon="pi pi-save"
        @click="saveProcessFixing()"
        label="Save"
        severity="primary"
      ></Button>
      <Button
        style="width: auto"
        icon="pi pi-eraser"
        @click="clearData(dataFileValue)"
        label="Clear"
        severity="primary"
      ></Button>
    </div>
  </div>
  <div class="card flex flex-col gap-4 w-full">
    <h2 class="font-semibold text-xl">Listing</h2>
    <div class="flex flex-col w-72">
      <DatePicker
        v-model="dateRange"
        selectionMode="range"
        dateFormat="dd/mm/yy"
        placeholder="Select date range"
        showIcon
        :manualInput="false"
      />
    </div>
    <DataTable
      :value="logValue"
      paginator
      :rows="5"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      tableStyle="min-width: 50rem"
      class="text-sm"
    >
      <Column
        headerStyle="item-align: center"
        header="#"
        field="index"
        style="width: 50px; text-align: center"
      />
      <Column field="batch_no" sortable header="Batch No" />
      <Column field="tkt_no" sortable header="Help Desk Ticket" />
      <Column field="fix_type" sortable header="Issue Type Request" />
      <Column field="completed_date" sortable header="Completed Date" />
      <Column field="status" sortable header="Completed State" />
      <Column field="error_state" sortable header="Error" />
      <Column header="Action" :exportable="false" :colspan="1">
        <template #body="slotProps">
          <Button
            label="log Detail"
            icon="pi pi-eye"
            class="p-button-sm p-button-primary mr-1"
            @click="viewLogDetail(slotProps.data.id, slotProps.data.fix_type, 1)"
          />
          <Button
            label="Error Log"
            icon="pi pi-eye"
            class="p-button-sm p-button-primary mr-1"
            @click="viewLogDetail(slotProps.data.id, slotProps.data.fix_type, 2)"
          />
        </template>
      </Column>
    </DataTable>
    <div class="flex flex-wrap gap-2">
      <Button
        style="width: auto"
        icon="pi pi-refresh"
        @click="loadFixLog(fixType)"
        label="Refresh"
        severity="primary"
      ></Button>
      <Button style="width: auto" icon="pi pi-save" label="Save" severity="primary"></Button>
      <Button style="width: auto" icon="pi pi-eraser" label="Clear" severity="primary"></Button>
    </div>
  </div>
  <Dialog
    v-model:visible="isModalOpen"
    :header="sheetIdList"
    :style="{ minHeight: '50%', maxWidth: '90%', minWidth: '80%' }"
    maximizable
    modal
  >
    <DataTable
      :value="tableRows"
      scrollable
      scrollHeight="flex"
      tableStyle="min-width: 10rem"
      showGridlines
      paginator
      :rows="5"
      size="small"
      class="text-sm text-center"
    >
      <Column
        headerStyle="text-center"
        header="#"
        field="index"
        style="width: 50px; text-align: center"
      />
      <Column
        v-for="(col, index) in tableColumns"
        :key="index"
        :field="col.field"
        :header="col.header"
      />
    </DataTable>
    <template #footer>
      <div class="flex flex-wrap gap-2">
        <Button
          style="width: 100px"
          icon="pi pi-download"
          @click="downloadFromRef(sheetPreviewTable, sheetIdList)"
          label="Download"
          severity="info"
        />
        <Button style="width: 100px" severity="secondary" @click="closeModal" label="Close" />
      </div>
    </template>
  </Dialog>
  <Dialog
    header="Confirmation"
    v-model:visible="displayConfirmation"
    :style="{ width: '350px' }"
    :modal="true"
  >
    <div class="flex items-center justify-center">
      <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
      <span>Are you sure you want to download this sample template?</span>
    </div>
    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        value="displayConfirmation"
        @click="closeConfirmation(value)"
        text
        severity="danger"
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        @click="confirmDownload"
        severity="success"
        outlined
        autofocus
      />
    </template>
  </Dialog>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
