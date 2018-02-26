/// <reference path='/var/www/html/BJS/Babylon.js/dist/preview release/babylon.d.ts' />
"use strict";

var createScene = function(canvas, engine) {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2, 0.4, 0.8);
    var camera = new BABYLON.ArcRotateCamera("cam", 0, 0, 0, BABYLON.Vector3.Zero(), scene);    
    camera.attachControl(canvas, true);
    

    var light = new BABYLON.PointLight("pl", camera.position, scene);
    light.specular = BABYLON.Color3.Black();


    var characterNb = 150.0;
    var areaSize = 100.0;

    camera.setPosition(new BABYLON.Vector3(0, areaSize * 0.1, -areaSize * 0.5));
	
	var plane = new BABYLON.Plane(0, 1, 0, 0);
	
	var cylinder = BABYLON.MeshBuilder.CreateTube("tube", {path: [new BABYLON.Vector3(0, -1, 0), new BABYLON.Vector3(0, 0.8, 0)], tessellation: 16, radius: 0.5}, scene);
	//cylinder.minimizeVertices();
	var cylinderLimb = cylinder.clone("");
	cylinderLimb.scaling = new BABYLON.Vector3(0.4, 0.7, 0.4);
	
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {segments: 16}, scene);
	sphere.minimizeVertices();
	
	var split = splitMesh(sphere, plane, scene);
	sphere.dispose();
	split.positive_section.material = new BABYLON.StandardMaterial("", scene);
	split.positive_section.material.wireframe = true;
	var head = split.positive_section.clone("");
	head.position.y = 0.8;
	head.scaling.y = 1.5;
	
	var topLimb = split.positive_section.clone("");
	topLimb.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
	topLimb.position.y = 0.49;
	
	split.negative_section.material = new BABYLON.StandardMaterial("", scene);
	split.negative_section.material.wireframe = true;
	var base = split.negative_section.clone("");
	base.position.y = -1;
	
	var baseLimb  = split.negative_section.clone("");
	baseLimb.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
	baseLimb.position.y = -0.7;
	
	split.positive_section.dispose();
	split.negative_section.dispose();
	
	var body = BABYLON.Mesh.MergeMeshes([cylinder, head, base], true);
	body.material = new BABYLON.StandardMaterial("", scene);
	body.scaling = new BABYLON.Vector3(1.2, 1, 1.2);
	body.material.diffuseColor = BABYLON.Color3.Red();
	
	var limb = BABYLON.Mesh.MergeMeshes([cylinderLimb, topLimb, baseLimb], true);
	limb.material = new BABYLON.StandardMaterial("", scene);
	limb.material.diffuseColor = BABYLON.Color3.Red();


    var bodyNb = characterNb;
    var bodyLimit = bodyNb;                     // one body per character       
    var leftUpperArmLimit = bodyLimit + bodyNb;      // 2 arms per body, 2 parts per arm
	var rightUpperArmLimit = leftUpperArmLimit + bodyNb;
    var leftUpperLegLimit = rightUpperArmLimit + bodyNb;  // 2 legs per body, 2 parts per leg
	var rightUpperLegLimit = leftUpperLegLimit + bodyNb;
	var leftLowerArmLimit = rightUpperLegLimit + bodyNb;
	var rightLowerArmLimit = leftLowerArmLimit + bodyNb;
	var leftLowerLegLimit = rightLowerArmLimit + bodyNb;
	var rightLowerLegLimit = leftLowerLegLimit + bodyNb;
    
    var pi2 = Math.PI * 0.5;
    var upperArmOffsetX = 0.75;
	var upperArmOffsetY = 0.2;
    var upperArmPivot = 0.8;
    var upperArmRotationLimit = 0.33;
	var lowerArmOffsetY = -1.65;
	var lowerArmPivot = 0.8;
    var lowerArmRotationLimit = 1;
	var upperLegOffsetX = 0.3;
	var upperLegOffsetY = -2.0;
    var upperLegPivot = 1.0;
    var upperLegRotationLimit = 0.33;
	var lowerLegOffsetY = -1.65;
	var lowerLegPivot = 1.0;
    var lowerLegRotationLimit = upperLegRotationLimit;

    var initialPositions = [];
	var vector = BABYLON.Vector3.Zero();

    var initParticle = function(particle) { 
		particle.color = BABYLON.Color3.Red();
		particle.angle = 0.33 * Math.random();
        // body
        if (particle.idx < bodyLimit) {
			particle.direction = BABYLON.Vector3.Zero();
			particle.angle = 2 * Math.PI * Math.random();
			particle.a = 1 + 0.2 * Math.random();
			particle.b = 2 * (Math.round(Math.random()) - 0.5) * areaSize / 8 + 80 * Math.random();
			particle.c = 2 * (Math.round(Math.random()) - 0.5) * areaSize / 8 + 80 * Math.random();
			particle.r = particle.a + particle.b * Math.cos(particle.angle) + particle.c * Math.sin(particle.angle);
			particle.position.x = particle.r * Math.cos(particle.angle) - particle.b * Math.random();
			particle.position.z = particle.r * Math.sin(particle.angle) - particle.c * Math.random();
			var speedFactor = Math.pow(0.999, (particle.idx % bodyLimit) + 1) / 256;
			var angle = particle.angle + Math.PI * speedFactor;				
			var r = particle.a + particle.b * Math.cos(angle) + particle.c * Math.sin(angle);
			vector.set(r * Math.cos(angle) - particle.b, 0, r * Math.sin(angle) - particle.c).scale(10);	
			vector.subtractToRef(particle.position, particle.direction);
			var theta = Math.acos(BABYLON.Vector3.Dot(BABYLON.Axis.X, particle.direction)/particle.direction.length());			
			if(particle.direction.z < 0) {
				if(particle.direction.x < 0) {
					theta += Math.PI;
				}
				else {
					theta *= -1;
				}
			}			
			particle.rotation.y = -theta + Math.PI / 2;			
        }
        // upper left arm
        else if (particle.idx < leftUpperArmLimit) {
            particle.parentId = particle.idx - bodyLimit;   // the upper left arm is attached to the body
            particle.position.x = -upperArmOffsetX;
			particle.position.y = upperArmOffsetY;
            particle.pivot.y = upperArmPivot;
            particle.translateFromPivot = false;
			particle.rotation.x = -upperArmRotationLimit;
            particle.rotationLimit = -upperArmRotationLimit;
        }
		// upper right arm
        else if (particle.idx < rightUpperArmLimit) {
            particle.parentId = particle.idx - leftUpperArmLimit;   // the upper right arm is attached to the body
            particle.position.x = upperArmOffsetX;
			particle.position.y = upperArmOffsetY;
            particle.pivot.y = upperArmPivot;
            particle.translateFromPivot = false;
            particle.rotation.x = upperArmRotationLimit;
            particle.rotationLimit = upperArmRotationLimit;
        }
		// upper left leg
        else if (particle.idx < leftUpperLegLimit) {
            particle.parentId = particle.idx - rightUpperArmLimit;   // the upper left leg is attached to the body
            particle.position.x = -upperLegOffsetX;
			particle.position.y = upperLegOffsetY;
            particle.pivot.y = upperLegPivot;
            particle.translateFromPivot = false;
            particle.rotation.x = upperLegRotationLimit;
            particle.rotationLimit = upperLegRotationLimit;
        }
		// upper right leg
        else if (particle.idx < rightUpperLegLimit) {
            particle.parentId = particle.idx - leftUpperLegLimit;   // the upper right leg is attached to the body
            particle.position.x = upperLegOffsetX;
			particle.position.y = upperLegOffsetY;
            particle.pivot.y = upperLegPivot;
            particle.translateFromPivot = false;
            particle.rotation.x = -upperLegRotationLimit;
            particle.rotationLimit = -upperLegRotationLimit;
        }
		// lower left arm
        else if (particle.idx < leftLowerArmLimit) {
            particle.parentId = particle.idx - 4 * bodyLimit;   // the lower left arm is attached to the upper left arm
            particle.position.y = lowerArmOffsetY;
            particle.pivot.y = lowerArmPivot;
            particle.translateFromPivot = false;
            particle.rotation.x = lowerArmRotationLimit;
            particle.rotationLimit = lowerArmRotationLimit;
			particle.angle = Math.PI;
        }
		// lower right arm
        else if (particle.idx < rightLowerArmLimit) {
			particle.parentId = particle.idx - 4 * bodyLimit;   // the lower right arm is attached to the upper right arm
            particle.position.y = lowerArmOffsetY;
            particle.pivot.y = lowerArmPivot;
            particle.translateFromPivot = false;
            particle.rotation.x = lowerArmRotationLimit;
            particle.rotationLimit = lowerArmRotationLimit;
        }
		// lower left leg
        else if (particle.idx < leftLowerLegLimit) {
            particle.parentId = particle.idx - 4 * bodyLimit;   // the lower left leg is attached to the upper left leg
            particle.position.y = lowerLegOffsetY;
            particle.pivot.y = lowerLegPivot;
            particle.translateFromPivot = false;
            particle.rotation.x = lowerLegRotationLimit;
            particle.rotationLimit = lowerLegRotationLimit;
        }  
		// lower right leg
        else if (particle.idx < rightLowerLegLimit) {
            particle.parentId = particle.idx - 4 * bodyLimit;   // the lower right leg is attached to the upper right leg
            particle.position.y = lowerLegOffsetY;
            particle.pivot.y = lowerLegPivot;
            particle.translateFromPivot = false;
            particle.rotation.x = lowerLegRotationLimit;
            particle.rotationLimit = lowerLegRotationLimit;
        }  
    };

    // particle custom update function

    var updateParticle = function(particle) {
        // move lower legs
        if (particle.idx >= rightLowerArmLimit) {
            var speedFactor = Math.pow(0.999, (particle.idx % bodyLimit) + 1) / 4;				
			particle.angle += Math.PI * speedFactor;			
			if(particle.angle >= 2 * Math.PI) {
				particle.angle = 0;
			}
            particle.rotation.x = Math.abs(Math.sin(particle.angle)) * particle.rotationLimit; 
       }
		// move lower arms
        else if (particle.idx >= rightUpperLegLimit) {
            var speedFactor = Math.pow(0.999, (particle.idx % bodyLimit) + 1) / 4;			
			particle.angle += Math.PI * speedFactor;			
			if(particle.angle >= 2 * Math.PI) {
				particle.angle = 0;
			}
            particle.rotation.x =  -Math.abs(Math.sin(particle.angle / 2)) * particle.rotationLimit; 
       }
	   // move upper arms and legs
	   else if(particle.idx >= bodyLimit) {
		   var speedFactor = Math.pow(0.999, (particle.idx % bodyLimit) + 1) / 4;	   
			particle.angle += Math.PI * speedFactor;				
			if(particle.angle >= 2 * Math.PI) {
				particle.angle = 0;
			}
            particle.rotation.x = Math.cos(particle.angle) * particle.rotationLimit;			
	   }
       // move body
       else {
			var speedFactor = Math.pow(0.999, (particle.idx % bodyLimit) + 1) / 256;
			particle.angle = particle.angle + Math.PI * speedFactor;	
			particle.r = particle.a + particle.b * Math.cos(particle.angle) + particle.c * Math.sin(particle.angle);
			particle.position.x = particle.r * Math.cos(particle.angle) - particle.b;
			particle.position.z = particle.r * Math.sin(particle.angle) - particle.c;
			var angle = particle.angle + Math.PI * speedFactor;				
			var r = particle.a + particle.b * Math.cos(angle) + particle.c * Math.sin(angle);
			vector.set(r * Math.cos(angle) - particle.b, 0, r * Math.sin(angle) - particle.c).scale(10);	
			vector.subtractToRef(particle.position, particle.direction);
			var theta = Math.acos(BABYLON.Vector3.Dot(BABYLON.Axis.X, particle.direction)/particle.direction.length());	
			if(particle.direction.z < 0) {
				if(particle.direction.x < 0) {
					theta += Math.PI;
				}
				else {
					theta *= -1;
				}
			}
			particle.rotation.y = (-theta + Math.PI / 2);
       }
    };

    // proto sps creation
    var sps = new BABYLON.SolidParticleSystem("sps", scene);
    sps.addShape(body, characterNb);            // 1 body
    sps.addShape(limb, 8 * characterNb);           // 8 limbs

    body.dispose();                    // free memory
    limb.dispose();
    sps.buildMesh();                        // build the sps mesh

    // init particles
    sps.updateParticle = initParticle;
    sps.setParticles();
    //sps.computeParticleTexture = false;
    sps.computeParticleColor = false;
    sps.isAlwaysVisible = true;

    // animation
    sps.updateParticle = updateParticle; 

    // ground
    var ground = BABYLON.MeshBuilder.CreateGround("g", {width: areaSize * 2.0, height: areaSize * 2.0, subdivisions: 20 }, scene);
    var gm = new BABYLON.StandardMaterial("gm", scene);
    gm.specularColor = BABYLON.Color3.Black();
    gm.diffuseColor = new BABYLON.Color3(0.8, 0.5, 0.3);
    ground.material = gm;
	//gm.wireframe = true;
    ground.position.y = -4.8;
    ground.alwaysSelectAsActiveMesh = true;
    ground.freezeWorldMatrix();

	sps.setParticles()

    scene.registerBeforeRender(function() {
        sps.setParticles();
    });

    return scene;
};



var init = function() {
    var canvas = document.querySelector('#renderCanvas');
    var engine = new BABYLON.Engine(canvas, true);
    var scene = createScene(canvas, engine);
    window.addEventListener("resize", function() {
        engine.resize();
    });


    var limit = 20;
    var count = 0;
    var fps = 0;
    var fpsElem = document.querySelector("#fps");
    engine.runRenderLoop(function(){
        count++;
        scene.render();
        if (count == limit) {
            fps = Math.floor(engine.getFps());
            fpsElem.innerHTML = fps.toString() + " fps";
            count = 0;
        }
    });
};