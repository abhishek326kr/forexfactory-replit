import PostEditor from '../PostEditor';

export default function PostEditorExample() {
  return (
    <div className="p-6">
      <PostEditor 
        onSave={(data) => console.log('Saving post:', data)}
      />
    </div>
  );
}