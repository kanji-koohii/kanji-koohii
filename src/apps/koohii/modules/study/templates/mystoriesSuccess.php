<?php
  use_helper('FrontEnd', 'Widgets');
  $num_stories = StoriesPeer::getStoriesCounts($sf_user->getUserId());
?>

<h2>My Stories</h2>

<div class="mystories-stats text-xl mb-6">
  <strong><?php echo $num_stories->private ?></strong> private</li>, 
  <strong><?php echo $num_stories->public ?></strong> public</li>
  (<?php echo $num_stories->total ?> total)
</div>

<div class="mb-6" style="position:relative;">
  <div style="position:absolute;right:0;top:0;">
    <?php echo _bs_button_with_icon('Export to CSV', 'study/export', ['icon' => 'fa-file']) ?>
  </div>

  <div id="app-vue" class="mb-3">
    <div class="my-stories-select">
      <div class="td">
        Sort
      </div>
      <div class="td">
      <select v-model="selected" class="form-control">
        <option v-for="option in options" v-bind:value="option.value">
          {{ option.text }}
        </option>
      </select>
      </div>
    </div>
    <div v-if="selected === 'public'" style="padding:0.3em 0;font-style:italic">
      Showing public stories only.
    </div>

  </div>
</div>

<?php if ($sort_active === 'public'): ?>
  <div class="confirmwhatwasdone">
    Note: displaying only <strong>public stories</strong>.
  </div>
<?php endif ?>

<div id="MyStoriesComponent">
  <?php include_component('study', 'MyStoriesTable', ['stories_uid' => $sf_user->getUserId(), 'profile_page' => false]) ?>
</div>

<?php koohii_onload_slot() ?>
//<script>
(function(){
  // this uses really outdated Javascript and no ES2015 since it's not in the build,
  //  but will do until a proper VueJS refactor

  var _php_options = <?php echo json_encode($sort_options, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?>

  var ajaxTable = null

  var mystories_url = "<?php echo url_for('study/mystoriesTable') ?>"

  var vm = new Vue({
    el: '#app-vue',
    data: {
      selected: <?php echo js_string_quoted($sort_active) ?>,
      options: _php_options
    },

    watch: {
      selected: function(value) {
        var option = this.getOption(value)
        var oAjaxPanel = this.getAjaxPanel()

        // hack-ish but those classes are pretty obsolete anyway and will be replaced
        oAjaxPanel.post({ 'sort': option.value })
      }
    },

    methods: {
      getAjaxPanel: function() {
        if (ajaxTable === null) {
          ajaxTable = new Koohii.UX.AjaxTable('MyStoriesComponent')
        }
        return ajaxTable.oAjaxPanel
      },

      getOption: function(value) {
        var i
        for (i = 0; i < this.options.length; i++) {
          if (this.options[i].value === value) {
            return this.options[i]
          }
        }
        return null
      }
    }
  });
}())
<?php end_slot() ?>