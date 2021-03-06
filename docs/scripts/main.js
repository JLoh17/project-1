//import Game from '/scripts/game.js'

// Character constant
const CHARACTER_WIDTH = 20
const CHARACTER_HEIGHT = 20
const FPS = 60
const LOOP_INTERVAL = Math.round(1000 / FPS)
const VELOCITY = 2
const INVINCIBLE_TIME = 1000

// Opposition player
const OPPOSITION_WIDTH = 30
const OPPOSITION_HEIGHT = 30

// Opposition GK
const OPPOSITION_GK_WIDTH = 20
const OPPOSITION_GK_HEIGHT = 30

// Ball constant
const BALL_WIDTH = 7
const BALL_HEIGHT = 7
const BALL_VELOCITY = 3
const BALL_TIME = 2000

// Time left constant
const $timeLeftText = $('#time-left')
const INIT_SECONDS = 60
const INIT_MS = INIT_SECONDS * 1000
const PENALTY_SECONDS = 5
const PENALTY_MS = PENALTY_SECONDS * 1000
const CLOCK_INVOKE_INTERVAL = 100

// Game Over Box
const $gameOverBox = $('#game-over-box')
const $scoreText = $('#game-over-score')
const $restartBTN = $('#restart-btn')

// Game Screen Box
const $gameScreen = $('#game-screen')
const $gameArea = $('#game-area')
const $display = $('#display')
const $startingInstruction = $('#starting-instruction')
const gameWidth = $gameArea.width()
const gameHeight = $gameArea.height()
const $resetBall = $('#reset-ball')
const $textArea = $('.text-area')

// Score
const $displayScore = $('#display-score')
const PENALTY_POINT = 1

// Players
const $player = $('#player')
const $opPlay1 = $('#op-play1')
const $opPlay2 = $('#op-play2')
const $opPlay3 = $('#op-play3')
const $opPlay4 = $('#op-play4')
const $opPlay5 = $('#op-play5')
const $oppositionGk = $('#opposition-gk')
const $oppositionPlayer = $('.opposition-player')
const $ball = $('#ball')

// Goal
const $goal = $('#goal')
const GOAL_HEIGHT = 0
const GOAL_WIDTH = 96

// Other Global Values
let clockInterval, timeLeft, points, shooter
let gameLoop

let goal = {
  $elemGoal: $goal,
  position: { },
  dimension: {w: GOAL_WIDTH, h: GOAL_HEIGHT},
}

let fBall = {
  $elemBall: $ball,
  position: { },
  dimension: { w: BALL_WIDTH, h: BALL_HEIGHT },
  ballVelocity: BALL_VELOCITY,
  yBound: gameHeight,
  ballTime: BALL_TIME,
  shot: false
}

let player = {
  position: { x: 225 - (CHARACTER_WIDTH / 2), y: 560 },
  dimension: { w: CHARACTER_WIDTH, h: CHARACTER_HEIGHT},
  movement: { left: false, up: false, right: false, down: false, shoot: false },
  lastHit: 0
}

let opPlayers = [
  {
    $elem: $oppositionGk,
    dimension: { w: OPPOSITION_GK_WIDTH, h: OPPOSITION_GK_HEIGHT  },
    position: { y: 10 },
    levelVelocity: 2,
    lBound: 100,
    rBound: 350,
  }, {
    $elem: $opPlay1,
    dimension: { w: OPPOSITION_WIDTH, h: OPPOSITION_HEIGHT  },
    position: { y: 100 },
    levelVelocity: 2,
    lBound: 0,
    rBound: gameWidth
  }, {
    $elem: $opPlay2,
    dimension: { w: OPPOSITION_WIDTH, h: OPPOSITION_HEIGHT  },
    position: { y: 200 },
    levelVelocity: 2,
    lBound: 0,
    rBound: gameWidth
  }, {
    $elem: $opPlay3,
    dimension: { w: OPPOSITION_WIDTH, h: OPPOSITION_HEIGHT  },
    position: { y: 300 },
    levelVelocity: 2,
    lBound: 0,
    rBound: gameWidth
  }, {
    $elem: $opPlay4,
    dimension: { w: OPPOSITION_WIDTH, h: OPPOSITION_HEIGHT  },
    position: { y: 400 },
    levelVelocity: 2,
    lBound: 0,
    rBound: gameWidth
  }, {
    $elem: $opPlay5,
    dimension: { w: OPPOSITION_WIDTH, h: OPPOSITION_HEIGHT  },
    position: { y: 500 },
    levelVelocity: 2.5,
    lBound: 0,
    rBound: gameWidth
  }
]

// Game over process
const gameOver = () => {
  clearInterval(clockInterval)
  clearInterval(gameLoop)
  clockInterval = null
  gameLoop = null
  fBall.shot = false
  $player.hide()
  $ball.hide()
  $oppositionPlayer.hide()
  $gameScreen.hide()
  $display.hide()
  $textArea.hide()
  $gameOverBox.show() // show game over
  $scoreText.text(points) //show points score
}

const shotOutcome = () => {
  // Goal!
  if (fBall.position.x < 177 + GOAL_WIDTH &&
      fBall.position.x + fBall.dimension.w > 177 &&
      fBall.position.y < 0 + GOAL_HEIGHT &&
      fBall.position.y + fBall.dimension.h > 0){
    fBall.shot = false
    $textArea.addClass('flashing-text').addClass('red').text('You scored a goal!!')
    points++
    $displayScore.text(points)
    setOpposition()
    opPlayers.forEach((opPlay) => opPlay.levelVelocity++)
    resetPlayerPosition()
  }

  // Out of bounds - Left Side before the goal
  // Deleting all the 0s and non functions caused the player not to fire on the left side. If it works, don't break it!
  if (fBall.position.x < 0 + 176 &&
      fBall.position.x + fBall.dimension.w > 0 &&
      fBall.position.y < 0 &&
      fBall.position.y + fBall.dimension.h > 0) {
    fBall.shot = false
    $textArea.addClass('flashing-text').addClass('red').text('You missed!!')
    setTimeout(() => {$textArea.removeClass('flashing-text').removeClass('red').text('The ball must touch the blue bar to register a goal!')
    }, 1500);
  }

  // Out of bounds - Right Side after the goal
  // Ditto for below
  if (fBall.position.x < 274 + 177 &&
      fBall.position.x + fBall.dimension.w > 274 &&
      fBall.position.y < 0 &&
      fBall.position.y + fBall.dimension.h > 0) {
    fBall.shot = false
    $textArea.addClass('flashing-text').addClass('red').text('You missed!!')
    setTimeout(() => {$textArea.removeClass('flashing-text').removeClass('red').text('The ball must touch the blue bar to register a goal!')
    }, 1000);
  }

  // Hits opposition or GK
  opPlayers.forEach((opPlay) => {
    if (fBall.position.x < opPlay.position.x + opPlay.dimension.w &&
        fBall.position.x + fBall.dimension.w > opPlay.position.x &&
        fBall.position.y < opPlay.position.y + opPlay.dimension.h &&
        fBall.position.y + fBall.dimension.h > opPlay.position.y){
    fBall.shot = false
    $textArea.addClass('flashing-text').addClass('red').text('You hit the opposition!!')
    setTimeout(() => {textArea.removeClass('flashing-text').removeClass('red').text('The ball must touch the blue bar to register a goal!')
    }, 1500);
    }
  })
}

// Creates the shoot function and gets the ball to follow the player
const characterShoot = (e) => {
  const {
    position: { x, y },
    ballVelocity,
    shot
  } = fBall
  let newX = x
  let newY = y

  if (shot) {
    newY = newY - ballVelocity
  } else {
    newX = player.position.x + 7
    newY = player.position.y - 10
  }

  fBall.position.x = newX
  fBall.position.y = newY
  $ball.css('left', newX).css('top', newY)
}

// Generates a random number
const randomInt = (max) => {
  return Math.floor(Math.random() * max)
}

// Moves the character to the new position based on key events. Also makes sure the player is limited within the walls of the game.
const updateCharacterMovement = () => {
  const {
    position: { x, y },
    movement: { left, up, right, down, shoot }
  } = player
  let newX = x
  let newY = y

  if (left) {
    newX = x - VELOCITY < 0 ? 0 : newX - VELOCITY //left is 0 because the corner point is 0
  }
  if (up) {
    newY = y - VELOCITY < 0 ? 0 : newY - VELOCITY //up is also 0 because top left = 0
  }
  if (right) {
    newX = x + CHARACTER_WIDTH + VELOCITY > gameWidth ? gameWidth - CHARACTER_WIDTH : newX + VELOCITY
  }
  if (down) {
    newY = y + CHARACTER_HEIGHT + VELOCITY > gameHeight ? gameHeight - CHARACTER_HEIGHT : newY + VELOCITY
  }
  if (shoot) {
    fBall.shot = true
  }

  player.position.x = newX
  player.position.y = newY
  $player.css('left', newX).css('top', newY)
}

// Moves the opposition left and right based on where it was generated on the X-axis upon game start. If it is generated past the half way point, the opposition will move in that direction and vice versa.
const opMovement = () => {
  opPlayers.forEach((opPlay) => {
    const {
      $elem,
      dimension: { w },
      position: { x },
      velocity,
      lBound,
      rBound
    } = opPlay
    let newX = x

    if (velocity < 0) { // if opposition is heading to the left....
      if (x + velocity < lBound) {
        newX = lBound
        opPlay.velocity = velocity * -1 // switch and move to the right if it is generated on the right side of the wall
      } else {
        newX = newX + velocity // keep moving to the left
      }
    } else { // if opposition is heading to the right...
      if (x + w + velocity > rBound) {
        newX = rBound - w
        opPlay.velocity = velocity * -1 // switch and move to the left if it is generated on the left side of the wall
      } else {
        newX = newX + velocity // keep moving to the left
      }
    }

    opPlay.position.x = newX // updates the new X position in the array
    $elem.css('left', newX) // replaces the left position in CSS
  })
}

const checkCollision = () => { // will always run because this is in the function updateMovements
  const timeNow = Date.now() // shows unix date and time in numbers
  const isInvincible = (player.lastHit + INVINCIBLE_TIME) > timeNow // this makes the assignment tht lastHit + invincible_time > timeNow

  if (!isInvincible) {  // If lastHit + invincible_time < timeNow, then do the following
    $player.removeClass('flashing') // removing the flashing icon when hitting the player collides with the opposition

    opPlayers.forEach((opPlay) => { // iterates the player against each opposition to check for collisions
      if (player.position.x < opPlay.position.x + opPlay.dimension.w &&
          player.position.x + player.dimension.w > opPlay.position.x &&
          player.position.y < opPlay.position.y + opPlay.dimension.h &&
          player.position.y + player.dimension.h > opPlay.position.y) {
        $player.addClass('flashing') // flashing for 2 seconds
        player.lastHit = timeNow // It compares .lastHit + INVINCIBLE_TIME to this. Basically this makes sure the deduction happens every 1 second rather than every millisecond. It should be equal as < will rush it every millisecond.
        timeLeft -= PENALTY_MS
        points -= PENALTY_POINT
        $displayScore.text(points)
      }
    })
  }
}

// Every time this gets invoked, update character position/also includes collision. This is a general purpose container for all moving, shooting and collision events.
const updateMovements = () => {
  updateCharacterMovement()
  opMovement()
  characterShoot()
  shotOutcome()
  checkCollision()
}

// Update Seconds and Trigger Game Over
const updateSecondsLeft = () => {
  timeLeft = timeLeft - CLOCK_INVOKE_INTERVAL
  $timeLeftText.text((timeLeft / 1000).toFixed(1))
  if (timeLeft <= 0) gameOver()
}

// Start Clock
const startClock = () => {
  timeLeft = INIT_MS
  clockInterval = setInterval(updateSecondsLeft, CLOCK_INVOKE_INTERVAL)
}

// Toggle which direction the character is moving to based on the key event
const setPlayerMovement = (value, keyCode, e) => {
  switch (keyCode) {
    case 37:
      e.preventDefault() // locks the browser so it doesn't scroll because using arrow keys, using WASD won't have this problem
      player.movement.left = value
      break
    case 38:
      e.preventDefault()
      player.movement.up = value
      break
    case 39:
      e.preventDefault()
      player.movement.right = value
      break
    case 40:
      e.preventDefault()
      player.movement.down = value
      break
    case 32: //shoot
      e.preventDefault()
      player.movement.shoot = value
      break
    }
}

// Handling Key Down
const handleKeyDown = (e) => {
  if (!clockInterval) startClock()
  $startingInstruction.hide()
  setPlayerMovement(true, e.keyCode, e) //the extra e prevents default
}

// Handling Key Up
const handleKeyUp = (e) => {
  setPlayerMovement(false, e.keyCode, e)
}

// Resets the player position every time a goal is scored, or upon restart
const resetPlayerPosition = () => {
  player.position.x = 225 - ((player.dimension.w) / 2)
  player.position.y = 560
  setTimeout(() => {
    $textArea.removeClass('flashing-text').removeClass('red').text('The ball must touch the blue bar to register a goal!')
  }, 1500);
}


const setOpposition = () => {
  opPlayers.forEach((opPlay) => { // inputs the x co-ordinate into the opPlayers array
    const randomX = randomInt(420 - (opPlay.dimension.w / 2)) // sets the random X position
    opPlay.position.x =  randomX // max width of the game minus biggest width of the opponent
    opPlay.$elem.css('top', opPlay.position.y).css('left', opPlay.position.x) //sets the position of the opposition upon starting
    opPlay.velocity = randomX < (210 - opPlay.dimension.w) ? opPlay.levelVelocity * -1 : opPlay.levelVelocity // sets an IF function that was used under the opMovement variable
  })
}

// Reset the ball due to glitch
const resetBall = () => {
  fBall.shot = false
}

// Restart
const restart = () => {
  gameLoop = setInterval(updateMovements, LOOP_INTERVAL)
  points = 0
  $gameScreen.show()
  $displayScore.text('0')
  opPlayers.forEach((opPlay) => opPlay.levelVelocity = 2)
  $oppositionPlayer.show()
  setOpposition()
  $display.show()
  $textArea.show()
  $gameOverBox.hide()
  $player.show()
  $ball.show()
  resetPlayerPosition()
  $startingInstruction.show()
}

const init = () => {
  $(document).on('keydown', handleKeyDown)
  $(document).on('keyup', handleKeyUp)
  $restartBTN.on('click', restart)
  $resetBall.on('click', resetBall)
  restart()
}

init()
