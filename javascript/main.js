// CoronaVirus infects Javascript :(

// Credits for base canvas and particles :
// Colliding Particles in Canvas
// by Thodoris Tsiridis <3


(function() {

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
        };
    
        if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

    
(function() {
    console.log('hello');
    var SCREEN_WIDTH = 900;
    var SCREEN_HEIGHT = 500;
    
    var RADIUS = 110;
    
    var RADIUS_SCALE = 1;
    var RADIUS_SCALE_MIN = 1;
    var RADIUS_SCALE_MAX = 1.5;
    
    var QUANTITY = 200;
    
    var canvas;
    var context;
    var particles;
    
    var mouseX = (window.innerWidth - SCREEN_WIDTH);
    var mouseY = (window.innerHeight - SCREEN_HEIGHT);
    
    var targetX = 0;
    var targetY = 0;
    
    var PARTICLE_SIZE = 10, MOVEMENT_SPEED = 2;
    if (window.innerWidth <= 900) {PARTICLE_SIZE = 7.5; MOVEMENT_SPEED = 1.5;}
    var START_TIME, PREV_TIME, PREV_UPDATE_TIME;
    
    var distancing = document.getElementById('social_distancing').getAttribute('val')
    var SOCIAL_DISTANCING = false;
    if(distancing == 'yes') SOCIAL_DISTANCING = true;

    var old = document.getElementById('old_age').getAttribute('val')
    var young = document.getElementById('age').getAttribute('val')
    var OLD_AGE = false;
    

    const NUM_INFECTED = 2;
    const HEALTHY_COLOR = '#F0CCE2', INFECTED_COLOR = '#ff0000', RECOVERED_COLOR = '#00C2A7', DEATH_COLOR = '#0000ff';
    const RECOVERY_TIME = 10000 // in ms
    var MORTALITY_RATE = 1 // in %

    if (old == 'yes') {OLD_AGE = true; MORTALITY_RATE = 10;}
    if (young == 'young') MORTALITY_RATE = 1;

    var healthy_count = QUANTITY - NUM_INFECTED, infected_count = NUM_INFECTED, recovered_count = 0; 
    
    // Graph Part
    
    var dataInfected = [ {x: 0, y: 0}]
    var dataHealthy = [ {x: 0, y: QUANTITY - NUM_INFECTED}]
    var dataDead = [ {x: 0, y: 0}]
    var dataRecovered = [ {x: 0, y: 0}]

    var recd = 0;

    var options = {
        animationEnabled: true,
        theme: "light2",
        title: {
            text: "Population Health Statistics"
        },
        legend : {
            fontSize: 25
        },
        axisX: {
            title: "Time"
        },
        data: [
        {
            type: "splineArea",
            showInLegend: true,
            color: DEATH_COLOR,
            name: 'Deaths',
            dataPoints: dataDead
        },
        {
            type: "splineArea",
            showInLegend: true,
            color: HEALTHY_COLOR,
            name: 'Healthy Individuals',
            dataPoints: dataHealthy
        },
        {
            type: "splineArea",
            showInLegend: true,
            color: INFECTED_COLOR,
            name: 'Infected Individuals',
            dataPoints: dataInfected
        },
        {
            type: "spline",
            showInLegend: true,
            color: RECOVERED_COLOR,
            name: 'Recovered Individuals',
            dataPoints: dataRecovered
        }]
    };
    $("#chartContainer").CanvasJSChart(options);
    updateData();
    var xValue = 0;
    var yValue = 0;
    var newDataCount = 1;

    function addData() {
        console.log(dataInfected);
        
        /*
        if(newDataCount != 1) {
            $.each(data, function(key, value) {
                dataInfected.push({x: value[0], y: parseInt(value[1])});
                xValue++;
                yValue = parseInt(value[1]);
            });
        } else {
            //dataPoints.shift();
            dataInfected.push({x: data[0][0], y: parseInt(data[0][1])});
            xValue++;
            yValue = parseInt(data[0][1]);
        }
      
        newDataCount = 1;
        */
      
        $("#chartContainer").CanvasJSChart().render()
        setTimeout(updateData, 100);	
    }

    function updateData() {
        addData()
    }
    

    function init(){
        console.log('called init')
        document.getElementById('infected').innerHTML = 'Infected: ' + infected_count;
        document.getElementById('healthy').innerHTML = 'Healthy: ' + healthy_count;
        document.getElementById('recovered').innerHTML = 'Recovered: ' + recovered_count;

        canvas = document.getElementById('world');
    
        if(canvas && canvas.getContext) {
            console.log('got canvas')
            context = canvas.getContext('2d');
            context.globalCompositeOperation = 'destination-over';
            window.addEventListener('resize', windowResizeHandler, false);
            windowResizeHandler();
            createParticles();
            START_TIME = Date.now();
            PREV_TIME = START_TIME;
            PREV_UPDATE_TIME = START_TIME;

            loop();
        }
    }
    
    function createParticles(){
    
        particles = [];
        var depth = 0;
    
        for (var i = 0; i < QUANTITY; i++) {
            var posX = PARTICLE_SIZE/2 + Math.random() * (window.innerWidth - PARTICLE_SIZE/2)
            var posY = PARTICLE_SIZE/2 + Math.random() * (window.innerHeight - PARTICLE_SIZE/2);
        
            var speed = MOVEMENT_SPEED;
            var directionX = -speed + (Math.random() * speed*2);
            var directionY = -speed + (Math.random()* speed*2);

            // Creating NUM_INFECTED individuals at the end
            var infected = false, infectionTime = 1e10, fillColor = HEALTHY_COLOR;
            if (i>=QUANTITY-NUM_INFECTED)
                infected = true;
            
            if(infected)
            {
                infectionTime = Date.now();
                fillColor = INFECTED_COLOR;
            }

            if (SOCIAL_DISTANCING)
            {
                var speed_options = [0.1,0.1,0.1,MOVEMENT_SPEED];
                var idx = Math.floor(Math.random() * speed_options.length);
                speed = speed_options[idx];
                if (infected) speed = MOVEMENT_SPEED
            }

            var particle = {
                position: { x: posX, y: posY },
                size: PARTICLE_SIZE,
                directionX: directionX,
                directionY: directionY,
                speed: speed,
                targetX: posX,
                targetY: posY,
                depth: depth,
                index:i,
                fillColor: fillColor,
                infected: infected,
                infectionTime: infectionTime
            };
        
            particles.push( particle );
        }
        // Particles Created
        console.log('particles created');
    }
    
    function loop(){
    
        context.fillStyle = '#F8FAFC';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    
        var z = 0;
        var xdist = 0;
        var ydist = 0;
        var dist = 0;

        var ifn = 0, hlthy = 0, rcvrd = 0, dead = 0;
    
       

        for (var i=0; i < particles.length; i++) {
            var day_completed = ((Date.now() - PREV_TIME) >= 2500)
    
            var particle = particles[i];
            
            if (particle.fillColor == RECOVERED_COLOR)
                rcvrd++;
            else if(particle.fillColor == HEALTHY_COLOR)
                hlthy++;
            else if(particle.fillColor == INFECTED_COLOR)
                ifn++;
            else
                dead++;

            var lp = { x: particle.position.x, y: particle.position.y };
        
            if(particle.position.x <=particle.size/2 || particle.position.x >= SCREEN_WIDTH - PARTICLE_SIZE/2){
                particle.directionX *= -1;
            }
        
            if(particle.position.y <=particle.size/2 || particle.position.y >= SCREEN_HEIGHT - PARTICLE_SIZE/2){
                particle.directionY *= -1;
            }
            
            

            for(var s=0; s < particles.length; s++) {
                var bounceParticle = particles[s];
                if(bounceParticle.index != particle.index) {
                    //what are the distances
                    z = PARTICLE_SIZE;
                    xdist = Math.abs(bounceParticle.position.x - particle.position.x);
                    ydist = Math.abs(bounceParticle.position.y - particle.position.y);
                    dist = Math.sqrt(Math.pow(xdist, 2) + Math.pow(ydist, 2));
                    if(dist < z) {
                        randomiseDirection(particle);
                        randomiseDirection(bounceParticle);

                        // infecting the other individual
                        if(bounceParticle.infected || particle.infected)
                        {
                            infect(particle)
                            infect(bounceParticle)    
                        }
                    }
                }
            }
    
            particle.position.x -= particle.directionX;
            particle.position.y -= particle.directionY;

            // check for recovery
            if (particle.infected && Date.now() - particle.infectionTime >= RECOVERY_TIME)
            {
                recover(particle)
            }

            // check for death
            if (OLD_AGE && particle.infected && Date.now() - START_TIME >= 10000 && day_completed)
            {
                var prob = Math.floor(Math.random() * 100);
                console.log(prob)
                if(prob <= MORTALITY_RATE)
                {
                    die(particle);
                }
                
            }

            
            context.beginPath();
            context.fillStyle = particle.fillColor;
            context.lineWidth = particle.size;
            context.moveTo(lp.x, lp.y);
            context.arc(particle.position.x, particle.position.y, particle.size/2, 0, Math.PI*2, true);
            context.closePath();
            context.fill();
        }
        if (Date.now() - PREV_TIME >= 2500) PREV_TIME = Date.now()

        document.getElementById('infected').innerHTML = 'Infected: ' + ifn;
        document.getElementById('healthy').innerHTML = 'Healthy: ' + hlthy;
        document.getElementById('recovered').innerHTML = 'Recovered: ' + rcvrd;
        if(OLD_AGE) document.getElementById('dead').innerHTML = 'Dead: ' + dead;

        if(Date.now() - PREV_UPDATE_TIME >= 100)
        {
            var index = dataInfected.length - 1;
            dataInfected.push({x: index+1, y: ifn});
            dataHealthy.push({x: index+1, y: hlthy});
            dataDead.push({x: index+1, y: dead});
            dataRecovered.push({x: index+1, y: recd})
            PREV_UPDATE_TIME = Date.now(); 
        }
        
        var reqAnim = requestAnimationFrame(loop);

        if (Date.now() - START_TIME >= 30000) cancelAnimationFrame(reqAnim);
    }
    
    function randomiseDirection (particle) {
    
        //pick a random deg
        var d = 0;
        while((d == 0) || (d == 90) || (d == 180) || (d == 360)) {
        d = Math.floor(Math.random() * 360);
        }
    
        var r = (d * 180)/Math.PI;
        particle.directionX = Math.sin(r) * particle.speed;
        particle.directionY = Math.cos(r) * particle.speed;
    
    }
    
    function windowResizeHandler() {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = Math.min(window.innerHeight, 720);
        canvas.width = SCREEN_WIDTH;
        canvas.height = SCREEN_HEIGHT;
    }

    // infecting the particle
    function infect(particle)
    {
        if (particle.fillColor != HEALTHY_COLOR)
            return ;
        particle.infected = true;
        particle.infectionTime = Date.now();
        particle.fillColor = INFECTED_COLOR;
    }

    function recover(particle)
    {
        particle.infected = false;
        particle.fillColor = RECOVERED_COLOR;
        recd++;
    }

    function die(particle)
    {
        particle.infected = false;
        particle.fillColor = DEATH_COLOR;
        particle.speed = 0.1;
    }
    
    init();
    
}());