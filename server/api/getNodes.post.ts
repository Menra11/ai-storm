export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  let summary: string = ""
  for(let i = 0; i < body.selectedNodes.length; i++){
    summary += body.selectedNodes[i];
  }
  return summary;
})
