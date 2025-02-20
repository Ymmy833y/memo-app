import Editor from '@toast-ui/editor';

const editor = new Editor({
  el: document.querySelector('#editor'),
  height: '400px',
  initialEditType: 'wysiwyg',
  previewStyle: 'vertical',
  theme: 'dark'
});
