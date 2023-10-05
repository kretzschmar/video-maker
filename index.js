import robots from "./robots/robots.js"

async function start() {
  robots.input()
  await robots.text()
  await robots.image()
  //await robots.video()
  //await robots.youtube()
}

start()
