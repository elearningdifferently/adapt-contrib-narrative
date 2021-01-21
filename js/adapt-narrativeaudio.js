define([
  'core/js/adapt',
  './narrativeaudioView',
  'core/js/models/itemsComponentModel'
], function(Adapt, NarrativeView, ItemsComponentModel) {

  return Adapt.register('narrativeaudio', {
    model: ItemsComponentModel.extend({}),
    view: NarrativeView
  });

});
