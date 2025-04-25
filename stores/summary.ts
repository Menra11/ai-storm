import { defineStore } from 'pinia'

export const useMySummaryStore = defineStore('mySummaryStore',{
  state: () => ({ 
    summary: []
  }),
  actions: {}
})
