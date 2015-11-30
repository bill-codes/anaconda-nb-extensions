'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var parameterize = require('parameterize');

module.exports = yeoman.generators.Base.extend({
  prompting: function () {
    var done = this.async();

    this.log(yosay(
        'Welcome to the ' + chalk.red('generator-nbextension') + ' generator!'
    ));

    var prompts = [{
        name: 'extensionName',
        message: 'What is your extension\'s name ?'
    },{
        name: 'extensionLicense',
        message: 'What is your extension\'s license ?',
        default: 'TBD'
    }];

    this.prompt(prompts, function (props) {
      this.extensionName = props.extensionName;
      this.extensionParameterized = parameterize(props.extensionName);
      this.extensionLicense = props.extensionLicense;
      this.context = {
        name: this.extensionName,
        parameterized: this.extensionParameterized,
        license: this.extensionLicense
      }

      done();
    }.bind(this));
  },
  condaRecipe: function() {
    this.fs.copyTpl(
      this.templatePath('conda.recipe'),
      this.destinationPath('conda.recipe/'),
      this.context
    );
  },
  readme: function() {
    this.fs.copyTpl(
      this.templatePath('_README.md'),
      this.destinationPath('README.md'),
      this.context
    );
  },
  manifest: function() {
    this.fs.copyTpl(
      this.templatePath('_manifest.md'),
      this.destinationPath(this.extensionParameterized + '.md'),
      this.context
    );
  },
  manifest: function() {
    this.fs.copyTpl(
      this.templatePath('_setup.py'),
      this.destinationPath('setup.py'),
      this.context
    );
  },
});
