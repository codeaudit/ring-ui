import React, { DOM } from 'react';
import classNames from 'classnames';
import RingComponent from 'ring-component/ring-component';
import './loader.scss';

/**
 * @name Loader
 * @constructor
 * @extends {ReactComponent}
 * @example
 <example name="Loader">
   <file name="index.html">
     <div id="loader1" class="loader-container"></div>
     <div id="loader2" class="loader-container loader-container_black"></div>
   </file>

   <file name="index.js" webpack="true">
     require('./index.scss');
     var render = require('react-dom').render;
     var Loader = require('loader/loader');

     render(Loader.factory(), document.getElementById('loader1'));

     render(Loader.factory(), document.getElementById('loader2'));
   </file>
   <file name="index.scss">
    .loader-container {
      display: inline-block;
      padding: 60px;

      &_black {
        background-color: black;
      }
    }
   </file>
 </example>
 */

class Particle {
  constructor({x, y, radius, color}) {
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.color = color;

    this.decay = 0.01;
    this.life = 1;
  }

  step() {
    this.life -= this.decay;
  }

  isAlive() {
    return this.life >= 0;
  }

  draw(ctx) {
    let alpha = this.life >= 0 ? this.life : 0;
    ctx.fillStyle = ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha}`;

    ctx.beginPath();
    ctx.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default class Loader extends RingComponent {
  static defaultProps = {
    size: 96,
    colors: [
      {r: 215, g: 60, b: 234},  //#D73CEA
      {r: 145, g: 53, b: 224},  //#9135E0
      {r: 88, g: 72, b: 224},   //#5848F4
      {r: 37, g: 183, b: 255},  //#25B7FF
      {r: 89, g: 189, b: 0},    //#59BD00
      {r: 251, g: 172, b: 2},   //#fbac02
      {r: 227, g: 37, b: 129}   //#E32581
    ]
  };

  static calculateGradient(startColor, stopColor, position) {
    let calculateChannelValue = (a, b) => {
      return a + Math.round((b - a) * position);
    };

    return {
      r: calculateChannelValue(startColor.r, stopColor.r),
      g: calculateChannelValue(startColor.g, stopColor.g),
      b: calculateChannelValue(startColor.b, stopColor.b)
    }
  }

  didMount() {
    this.refs.canvas.width = this.props.size;
    this.refs.canvas.height = this.props.size;
    this.ctx = this.refs.canvas.getContext('2d');

    this.height = this.props.size;
    this.width = this.props.size;

    this.particles = [];

    //Configuration
    this.baseSpeed = 1.5;
    this.colorIndex = 0;
    this.maxRadius = 12;
    this.minRadius = 6;
    this.colorChangeTick = 40;

    //State
    this.x = 0;
    this.y = 0;
    this.radius = 8;
    this.hSpeed = 1.5;
    this.vSpeed = 1;
    this.radiusSpeed = 0.05;
    this.tick = 0;

    this.loop();
  }

  handleLimits(coord, radius, speed, limit) {
    if (coord + (radius*2) >= limit) {
      return -this.baseSpeed + (Math.random(this.baseSpeed) - this.baseSpeed/2);
    } else if (coord <= 1) {
      return this.baseSpeed + (Math.random(this.baseSpeed) - this.baseSpeed/2);
    }
    return speed;
  }

  calculateNextCoordinates() {
    this.x += this.hSpeed;
    this.y += this.vSpeed;

    this.hSpeed = this.handleLimits(this.x, this.radius, this.hSpeed, this.width);
    this.vSpeed = this.handleLimits(this.y, this.radius, this.vSpeed, this.height);
  }

  calculateNextRadius() {
    this.radius += this.radiusSpeed;

    if (this.radius > this.maxRadius || this.radius < this.minRadius) {
      this.radiusSpeed = -this.radiusSpeed;
    }
  }

  calculateNextColor() {
    let colors = this.props.colors;

    let currentColor = colors[this.colorIndex];
    let nextColor = colors[this.colorIndex + 1] || colors[0];

    return Loader.calculateGradient(currentColor, nextColor, this.tick/40);
  }

  step() {
    this.tick++;

    if (this.tick > 40) {
      this.tick = 0;
      this.colorIndex = this.props.colors.length >= this.colorIndex+2 ? this.colorIndex + 1 : 0;
    }

    this.calculateNextCoordinates();
    this.calculateNextRadius();

    this.particles.push(new Particle({
      x: this.x,
      y: this.y,
      radius: this.radius,
      color: this.calculateNextColor()
    }));
  }

  removeDeadParticles() {
    this.particles = this.particles.filter(it => it.isAlive());
  }

  drawParticle(particle) {
    particle.step();
    particle.draw(this.ctx);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.removeDeadParticles();
    this.particles.forEach((particle) => this.drawParticle(particle));
  }

  loop() {
    this.step();
    this.draw();
    requestAnimationFrame(() => this.loop());
  };

  render() {
    return <canvas ref="canvas" className="ring-loader__canvas"/>;
  }
}