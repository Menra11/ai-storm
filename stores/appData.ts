import { defineStore } from 'pinia'

export const useMyAppDataStore = defineStore('myAppDataStore',{

  state: () => ({
    selectedNode: undefined,
    // isHiddenNav: true,
    isHiddenCombineNav: true,
   }),
  actions: {}
})
