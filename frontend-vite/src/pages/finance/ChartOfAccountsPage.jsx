import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import { useToast } from '../../components/Toast';
import FormModal from '../../components/FormModal';
import { PlusIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
const ChartOfAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());
  const [viewMode, setViewMode] = useState('tree');
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    account_code: '',
    name: '',
    account_type: 'expense',
    category: ''
  });
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = viewMode === 'tree' ? '/api/finance/coa/hierarchy' : '/api/finance/coa';
      const response = await api.get(endpoint);
      let accountsData = [];
      if (viewMode === 'tree') {
        if (Array.isArray(response.data?.data)) {
          accountsData = response.data.data;
        }
      } else {
        if (response.data?.data?.accounts) {
          accountsData = Array.isArray(response.data.data.accounts) ? response.data.data.accounts : [];
        } else if (Array.isArray(response.data?.data)) {
          accountsData = response.data.data;
        }
      }
      setAccounts(accountsData);
    } catch (error) {
      showToast('Error fetching chart of accounts', 'error');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, showToast]);
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);
  const handleCreateAccount = () => {
    setFormData({
      account_code: '',
      name: '',
      account_type: 'expense',
      category: ''
    });
    setShowModal(true);
  };
  const handleSubmit = async () => {
    if (!formData.account_code || !formData.name) {
      showToast('Account code and name are required', 'error');
      return;
    }
    if (!formData.category) {
      showToast('Category is required (e.g. Current Assets, Operating Expenses)', 'error');
      return;
    }
    try {
      await api.post('/api/finance/coa', formData);
      showToast('Account created successfully', 'success');
      setShowModal(false);
      fetchAccounts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error creating account', 'error');
    }
  };
  const toggleExpanded = (accountId) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };
  const accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' }
  ];
  const getTypeColor = (type) => {
    const colors = {
      asset: 'bg-blue-100 text-blue-700',
      liability: 'bg-red-100 text-red-700',
      equity: 'bg-blue-100 text-blue-700',
      revenue: 'bg-green-100 text-green-700',
      expense: 'bg-orange-100 text-orange-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };
  const renderTree = (nodes, depth = 0) => {
    return nodes.map(account => (
      <div key={account.id}>
        <div
          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
          style={{ paddingLeft: `${12 + depth * 24}px` }}
        >
          {account.children && account.children.length > 0 ? (
            <button onClick={() => toggleExpanded(account.id)} className="p-0">
              {expandedAccounts.has(account.id) ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
            </button>
          ) : (
            <span style={{ width: 16 }} />
          )}
          <span className="font-mono text-sm font-semibold text-gray-500">{account.account_code}</span>
          <span className="text-gray-900 text-sm">{account.name}</span>
          <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(account.type)}`}>
            {account.type}
          </span>
        </div>
        {expandedAccounts.has(account.id) && account.children && account.children.length > 0 && (
          <div>{renderTree(account.children, depth + 1)}</div>
        )}
      </div>
    ));
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen page-bg">
        <div className="text-secondary">Loading chart of accounts...</div>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen page-bg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Chart of Accounts</h1>
          <p className="text-secondary mt-1">Manage your accounting hierarchy</p>
        </div>
        <button
          onClick={handleCreateAccount}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition bg-primary"
        >
          <PlusIcon size={20} />
          New Account
        </button>
      </div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('tree')}
          className={`px-4 py-2 rounded transition text-sm ${viewMode === 'tree' ? 'bg-primary text-white' : 'progress-bar-bg text-primary'}`}
        >
          Tree View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded transition text-sm ${viewMode === 'list' ? 'bg-primary text-white' : 'progress-bar-bg text-primary'}`}
        >
          List View
        </button>
      </div>
      {viewMode === 'tree' ? (
        <div className="bg-white rounded-lg border border-default p-6">
          {accounts.length === 0 ? (
            <p className="text-gray-500 text-sm">No accounts created yet</p>
          ) : (
            <div className="space-y-1">{renderTree(accounts)}</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500 text-sm">
                    No accounts created yet
                  </td>
                </tr>
              ) : (
                accounts.map(account => (
                  <tr key={account.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-500">{account.account_code}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{account.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-0.5 rounded text-xs font-medium ${getTypeColor(account.type)}`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{account.category || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Create Account Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Account"
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Code *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.account_code}
              onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
              placeholder="e.g., 1000, 2100, 4000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cash, Accounts Payable"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
            >
              {accountTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Current Assets, Operating Expenses"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};
export default ChartOfAccountsPage;