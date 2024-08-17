export async function getGreeting() {
  try {
    return "Hello from user routes!";
  } catch (e){
    console.log(`Error: ${e}`)
  }
}