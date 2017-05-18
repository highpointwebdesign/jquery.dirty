/// <reference path="../bower_components/jquery/dist/jquery.min.js" />
/// <reference path="../bower_components/qunit/qunit/qunit.js" />
/// <reference path="../dist/jquery.dirty.js" />

QUnit.module("jquery.dirty", {
    beforeEach: function () {
        // add form to page from template
        var form = $("#formTemplate").html();
        $("#qunit-fixture").html(form);
    },
    afterEach: function () {
        // clear form
        $("#qunit-fixture").html("");
    }
});

QUnit.test("jQuery.dirty is referenced", function(assert) {
  assert.ok($.fn.dirty !== undefined, "jQuery.dirty is defined");
  assert.ok(typeof($.fn.dirty) === "function", "jQuery.dirty is a function"); 
});

QUnit.test("default values exist", function(assert){

  assert.ok($.fn.dirty.defaults !== undefined, "default values are defined");
  assert.ok($.fn.dirty.defaults.preventLeaving !== undefined, "default preaventLeaving is defined");
  assert.ok($.fn.dirty.defaults.leavingMessage !== undefined, "default leavingMessage is defined");
  assert.ok($.fn.dirty.defaults.onDirty !== undefined, "default onDirty is defined");
  assert.ok($.fn.dirty.defaults.onClean !== undefined, "default onClean is defined");

});

QUnit.test("default values are as expected", function(assert){

  assert.ok($.fn.dirty.defaults.preventLeaving === false, "default preaventLeaving value is as expected");
  assert.ok(typeof($.fn.dirty.defaults.leavingMessage === "object"), "default leavingMessage value is as expected");
  assert.ok(typeof($.fn.dirty.defaults.onDirty === "function"), "default onDirty value is as expected");
  assert.ok(typeof($.fn.dirty.defaults.onClean === "function"), "default onClean value is as expected");

});

QUnit.test("form is marked as clean when plugin initialized", function(assert){
  // Arrange
  var $form = $("#testForm");
  
  // Act
  $form.dirty();

  // Assert
  assert.ok($form.dirty("isClean") === true, "form is clean when plugin initialized");
  assert.ok($form.dirty("isDirty") === false, "form is not dirty when plugin initialized");
});

QUnit.test("form is marked as dirty when modified", function(assert){
  // Arrange
  var $form = $("#testForm");
  $form.dirty();
  
  // Act
  var $input = $form.find("input:first");
  $input.val("test");
  $input.trigger("change");

  // Assert
  assert.ok($form.dirty("isClean") === false, "form is not clean when form modified");
  assert.ok($form.dirty("isDirty") === true, "form is dirty when form modified");
});