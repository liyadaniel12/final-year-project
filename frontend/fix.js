const fs = require('fs');
const file = 'c:\\Users\\HP\\project\\final-year-project\\frontend\\src\\app\\(dashboard)\\admin\\users\\page.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const correctLines = `              <select {...register('role')} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="branch_manager">Branch Manager</option>
                <option value="main_manager">Main Manager</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select {...register('status')} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {selectedRole === 'branch_manager' && (
            <div className="space-y-1">
              <Input label="Assigned Branch ID" {...register('branch_id')} className="rounded-xl" placeholder="branch_uuid_here" />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl h-10 px-4">Cancel</Button>
            <Button type="submit" disabled={saveUserMut.isPending} className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              {saveUserMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Save Changes' : 'Create User')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete User">
        <div className="space-y-4">
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-start gap-3 text-rose-800">
            <Trash2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold mb-1">Warning: Irreversible Action</p>
              <p>You are about to permanently delete the user <strong>{userToDelete?.full_name}</strong> ({userToDelete?.email}). This action cannot be undone.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Type <span className="font-mono font-bold select-all bg-slate-100 px-1 rounded">{userToDelete?.email}</span> to confirm:
            </label>
            <Input 
              value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} 
              className="rounded-xl focus:ring-rose-500/20 focus:border-rose-500" placeholder={userToDelete?.email} 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl h-10 px-4">Cancel</Button>
            <Button 
              disabled={deleteConfirmText !== userToDelete?.email || deleteUserMut.isPending} 
              onClick={() => userToDelete && deleteUserMut.mutate(userToDelete.id)} 
              className="rounded-xl h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
            >
              {deleteUserMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Permanently Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
`;

lines.splice(499, lines.length - 499, correctLines);
fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed');
