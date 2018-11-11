/******************************************************
 * PATTERN LAB NODE
 * EDITION-NODE-WEBPACK
 * The webpack wrapper around patternlab-node core, providing tasks to interact with the core library.
 ******************************************************/

/******************************************************
 * PATTERN LAB  NODE WRAPPER TASKS with core library
 ******************************************************/
const config = require('./patternlab-config.json');
const patternlab = require('@pattern-lab/core')(config);

function getConfiguredCleanOption() {
  return config.cleanPublic;
}

function build(done) {
  done = done || function(){};

  const buildResult = patternlab.build(() => {}, getConfiguredCleanOption());

  // handle async version of Pattern Lab
  if (buildResult instanceof Promise) {
    return buildResult.then(done);
  }

  return null;
}

function version() {
  patternlab.version();
}

function help(){
  patternlab.help();
}

function patternsonly() {
  function noop(){}

  patternlab.patternsonly(noop, config.cleanPublic);
}

function liststarterkits() {
  patternlab.liststarterkits()
}

function loadstarterkit(kit, clean) {

  if(!clean) {
    clean = false;
  }
  patternlab.loadstarterkit(kit, clean);
}

function installplugin(plugin) {
  patternlab.installplugin(plugin);
}

for (var i=0; i < process.argv.length; i++) {

  switch (process.argv[i]) {
    case 'build':
      build();
      break;
    case 'version':
      version();
      break;
    case 'help':
      help();
      break;
    case 'patternsonly':
      patternsonly();
      break;
    case 'liststarterkits':
      liststarterkits();
      break;
    case 'loadstarterkit':
      if(process.env.npm_config_kit) {
        loadstarterkit(process.env.npm_config_kit, process.env.npm_config_clean);
      } else {
        console.info("====[ Pattern Lab Error: No Valid Kit Found ]====");
      }
      break;
    case 'installplugin':
      if(process.env.npm_config_plugin) {
        installplugin(process.env.npm_config_plugin);
      } else {
        console.info("====[ Pattern Lab Error: No Valid Plugin Found ]====");
      }
    break;
  }
}
