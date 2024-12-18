// Combined game code in a single file: game.js
class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.setupRenderer();
        this.setupLighting();
        this.setupCamera();
        this.setupResizeHandler();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        document.body.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);
    }

    setupCamera() {
        this.camera.position.z = 1000;
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    add(object) {
        this.scene.add(object);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

class GameElements {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.score = 0;  // Move this to the top
        this.initialGoalieSpeed = 4;  // Move this to the top
        this.lives = 3;
        this.gameOver = false;
    
        this.createWater();
        this.createBall();
        this.createGoal();
        this.createGoalie();
        this.createScoreDisplay();
        this.createScoreCounter();  // Move this up before other UI elements
        this.createLivesDisplay();
        this.createGameOverDisplay();
        this.createWinDisplay();
    
        this.initialBallPosition = new THREE.Vector3(0, -300, 0);
    }

    createWater() {
        const waterGeometry = new THREE.PlaneGeometry(5000, 2000);
        const waterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1E90FF,
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });
        
        this.waterPlane = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterPlane.position.set(0, -300, -800);
        this.waterPlane.rotation.x = -Math.PI / 4;
        this.sceneManager.add(this.waterPlane);
    }

    createBall() {
        const sphereGeometry = new THREE.IcosahedronGeometry(40, 1);
        const sphereMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFF00,
            shininess: 100,
            flatShading: true
        });
        
        this.ball = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.ball.position.set(0, -300, 0);
        this.sceneManager.add(this.ball);
    }

    createGoal() {
        const postMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFFFF,
            shininess: 100,
            emissive: 0x444444
        });

        const goalGroup = new THREE.Group();
        const postRadius = 10; // Slightly thicker posts
        const goalWidth = 1500;  // Increased from 1200
        const goalHeight = 450;  // Increased from 360
        const goalDepth = 200;   // Increased from 160

        const createPost = (x, y, z, height, rotation = [0, 0, 0]) => {
            const geometry = new THREE.CylinderGeometry(postRadius, postRadius, height);
            const post = new THREE.Mesh(geometry, postMaterial);
            post.position.set(x, y, z);
            post.rotation.set(...rotation);
            return post;
        };

        const leftPost = createPost(-goalWidth/2, -goalHeight/2 + goalHeight/2, -400, goalHeight);
        const rightPost = createPost(goalWidth/2, -goalHeight/2 + goalHeight/2, -400, goalHeight);
        const crossbar = createPost(0, goalHeight/2, -400, goalWidth, [0, 0, Math.PI/2]);
        const sideBarLeft = createPost(-goalWidth/2, 0, -400-goalDepth/2, goalDepth, [Math.PI/2, 0, 0]);
        const sideBarRight = createPost(goalWidth/2, 0, -400-goalDepth/2, goalDepth, [Math.PI/2, 0, 0]);
        const backBar = createPost(0, 0, -400-goalDepth, goalWidth, [0, 0, Math.PI/2]);

        goalGroup.add(leftPost, rightPost, crossbar, sideBarLeft, sideBarRight, backBar);

        this.createNet(goalGroup, goalWidth, goalHeight, goalDepth);

        this.goal = goalGroup;
        this.sceneManager.add(this.goal);
    }

    createNet(goalGroup, goalWidth, goalHeight, goalDepth) {
        const netMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.3 });
        const netSegmentsWidth = 50;  // Increased number of segments for larger goal
        const netSegmentsHeight = 25;  // Increased number of segments for larger goal

        // Vertical net lines
        for (let i = 0; i <= netSegmentsWidth; i++) {
            const x = (goalWidth * i / netSegmentsWidth) - goalWidth/2;
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, -goalHeight/2, -400),
                new THREE.Vector3(x, goalHeight/2, -400),
                new THREE.Vector3(x, goalHeight/2, -400-goalDepth),
                new THREE.Vector3(x, -goalHeight/2, -400-goalDepth)
            ]);
            const line = new THREE.Line(geometry, netMaterial);
            goalGroup.add(line);
        }

        // Horizontal net lines
        for (let i = 0; i <= netSegmentsHeight; i++) {
            const y = (goalHeight * i / netSegmentsHeight) - goalHeight/2;
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-goalWidth/2, y, -400),
                new THREE.Vector3(goalWidth/2, y, -400),
                new THREE.Vector3(goalWidth/2, y, -400-goalDepth),
                new THREE.Vector3(-goalWidth/2, y, -400-goalDepth)
            ]);
            const line = new THREE.Line(geometry, netMaterial);
            goalGroup.add(line);
        }
    }

    animateWater() {
        if (this.waterPlane) {
            this.waterPlane.rotation.x = -Math.PI / 4 + Math.sin(Date.now() * 0.001) * 0.05;
        }
    }

    createGoalie() {
        const goalieGeometry = new THREE.PlaneGeometry(350, 200);
        const goalieTexture = new THREE.TextureLoader().load('ksi.png');
        const goalieMaterial = new THREE.MeshBasicMaterial({
            map: goalieTexture,
            transparent: true
        });
        
        this.goalie = new THREE.Mesh(goalieGeometry, goalieMaterial);
        this.goalie.position.set(0, -120, -390);
        this.goalieDirection = 1;
        this.goalieSpeed = this.initialGoalieSpeed;  // Use the initial speed
        this.sceneManager.add(this.goalie);
    }

    createScoreDisplay() {
        const scoreDiv = document.createElement('div');
        scoreDiv.id = 'scoreDisplay';
        document.body.appendChild(scoreDiv);
        this.scoreDisplay = scoreDiv;
    }

    createScoreCounter() {
        const scoreContainer = document.createElement('div');
        scoreContainer.id = 'scoreCounter';
        scoreContainer.textContent = `Score: 0`;
        document.body.appendChild(scoreContainer);
        this.scoreCounter = scoreContainer;
    }

    updateScoreDisplay(container = this.scoreCounter) {
        if (container) {
            container.textContent = `Score: ${this.score}`;
        }
    }

    createWinDisplay() {
        const winDiv = document.createElement('div');
        winDiv.id = 'winDisplay';
        winDiv.textContent = 'YOU WIN!';
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.className = 'restart-button';
        restartButton.onclick = () => this.restartGame();
        
        winDiv.appendChild(document.createElement('br'));
        winDiv.appendChild(restartButton);
        document.body.appendChild(winDiv);
        this.winDisplay = winDiv;
    }

    

    increaseGoalieSpeed() {
        this.goalieSpeed *= 1.35; // Increase speed by 8.5%
    }

    winGame() {
        this.gameOver = true;
        this.winDisplay.style.display = 'flex';
    }

    updateGoalie() {
        const maxX = 600; // Adjusted range of motion
        this.goalie.position.x += this.goalieSpeed * this.goalieDirection;

        if (Math.abs(this.goalie.position.x) > maxX) {
            this.goalieDirection *= -1;
        }
    }

    showScore(isGoal) {
        if (this.gameOver) return;
        
        this.scoreDisplay.textContent = isGoal ? 'GOALLLLL' : 'NO GOAL';
        this.scoreDisplay.style.opacity = '1';
        this.scoreDisplay.style.display = 'block';
        this.scoreDisplay.style.color = isGoal ? '#00ff00' : '#ff0000';
        
        if (isGoal) {
            this.score++;
            this.updateScoreDisplay();
            this.increaseGoalieSpeed();
            
            if (this.score >= 5) {
                this.winGame();
                return;
            }
        } else {
            this.updateLives();
        }
        
        setTimeout(() => {
            this.scoreDisplay.style.opacity = '0';
            setTimeout(() => {
                this.scoreDisplay.style.display = 'none';
            }, 300);
        }, 1700);
    }

    checkGoalieCollision(ballPosition) {
        const goalieBox = new THREE.Box3().setFromObject(this.goalie);
        const ballBox = new THREE.Box3().setFromObject(this.ball);
        
        return goalieBox.intersectsBox(ballBox);
    }

    resetBall() {
        this.ball.position.copy(this.initialBallPosition);
        this.ball.rotation.set(0, 0, 0);
    }

    createLivesDisplay() {
        const livesContainer = document.createElement('div');
        livesContainer.id = 'livesDisplay';
        
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('img');
            heart.src = 'fullheart.jpg';
            this.hearts.push(heart);
            livesContainer.appendChild(heart);
        }
        
        document.body.appendChild(livesContainer);
        this.livesDisplay = livesContainer;
    }

    createGameOverDisplay() {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'gameOverDisplay';
        gameOverDiv.textContent = 'GAME OVER';
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again';
        restartButton.className = 'restart-button';
        restartButton.onclick = () => this.restartGame();
        
        gameOverDiv.appendChild(document.createElement('br'));
        gameOverDiv.appendChild(restartButton);
        document.body.appendChild(gameOverDiv);
        this.gameOverDisplay = gameOverDiv;
    }

    updateLives() {
        if (this.lives > 0) {
            this.lives--;
            // Update the heart image (starting from the leftmost heart)
            this.hearts[this.lives].src = 'emptyheart.png'; // You'll need to provide this
            
            if (this.lives === 0) {
                this.endGame();
            }
        }
    }

    endGame() {
        this.gameOver = true;
        this.gameOverDisplay.style.display = 'flex';
    }

    restartGame() {
        this.lives = 3;
        this.score = 0;
        this.gameOver = false;
        this.goalieSpeed = this.initialGoalieSpeed;
        
        // Reset hearts
        this.hearts.forEach(heart => {
            heart.src = 'fullheart.jpg';
        });
        
        // Reset ball position
        this.resetBall();
        
        // Hide end game displays
        this.gameOverDisplay.style.display = 'none';
        this.winDisplay.style.display = 'none';
        
        // Reset score display
        this.updateScoreDisplay();
    }

}


class GameController {
    constructor(sceneManager, gameElements) {
        this.sceneManager = sceneManager;
        this.isMoving = false;
        this.targetPosition = new THREE.Vector3();
        this.canShoot = true;
        this.isDragging = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.mousePlaneZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 400);
        this.intersectionPoint = new THREE.Vector3();
        this.setupEventListeners();
        this.gameElements = gameElements;
    }

    setupEventListeners() {
        const renderer = this.sceneManager.renderer;
        
        // Mouse events
        renderer.domElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleInputStart(e.clientX, e.clientY);
        });

        renderer.domElement.addEventListener('mousemove', (e) => {
            e.preventDefault();
            this.handleInputMove(e.clientX, e.clientY);
        });

        renderer.domElement.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.handleInputEnd(e.clientX, e.clientY);
        });

        // Touch events
        renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleInputStart(touch.clientX, touch.clientY);
        });

        renderer.domElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleInputMove(touch.clientX, touch.clientY);
        });

        renderer.domElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.handleInputEnd(touch.clientX, touch.clientY);
        });
    }

    handleInputStart(clientX, clientY) {
        if (this.gameElements.gameOver) return;
        if (!this.isMoving && this.canShoot) {
            this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
            const intersects = this.raycaster.intersectObject(this.gameElements.ball);
            
            if (intersects.length > 0) {
                this.isDragging = true;
            }
        }
    }

    handleInputMove(clientX, clientY) {
        if (this.gameElements.gameOver) return;
        if (this.isDragging) {
            this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        }
    }

    handleInputEnd(clientX, clientY) {
        if (this.gameElements.gameOver) return;
        if (this.isDragging) {
            this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
            this.raycaster.ray.intersectPlane(this.mousePlaneZ, this.intersectionPoint);

            if (Math.abs(this.intersectionPoint.x) <= 600 && 
                Math.abs(this.intersectionPoint.y) <= 180 && 
                this.intersectionPoint.z <= -300) {
                
                this.targetPosition.copy(new THREE.Vector3(
                    this.intersectionPoint.x,
                    this.intersectionPoint.y,
                    -400
                ));
                
                this.isMoving = true;
                this.canShoot = false;
            }

            this.isDragging = false;
        }
    }

    update() {
        if (this.gameElements.gameOver) return;
        if (this.isMoving) {
            const ball = this.gameElements.ball;
            const speed = 0.05;
            ball.position.lerp(this.targetPosition, speed);
            ball.rotation.x += 0.05;
            ball.rotation.y += 0.05;

            // Check for goal attempt when ball reaches the goal plane
            if (ball.position.z <= -390) {
                const hitGoalie = this.gameElements.checkGoalieCollision(ball.position);
                this.gameElements.showScore(!hitGoalie);
                
                // Start return journey
                this.targetPosition.copy(this.gameElements.initialBallPosition);
            }

            // Reset shot when ball returns to initial position
            if (ball.position.distanceTo(this.gameElements.initialBallPosition) < 1) {
                this.isMoving = false;
                this.canShoot = true;
                this.gameElements.resetBall();
            }
        }

        // Update goalie position
        this.gameElements.updateGoalie();
    }
}

class Game {
    constructor() {
        this.sceneManager = new SceneManager();
        this.gameElements = new GameElements(this.sceneManager);
        this.gameController = new GameController(this.sceneManager, this.gameElements);
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.gameElements.animateWater();
        this.gameController.update();
        this.sceneManager.render();
    }
}

// Create a new game instance when the module loads
new Game();