'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserTrees, 
  createTree, 
  getAllPublicTrees, 
  requestJoinTree, 
  getPendingRequestsForOwner,
  updateRequestStatus,
  getUserJoinRequests,
  getPendingClaimsForAdmin,
  approveProfileClaim,
  rejectProfileClaim,
  getAllProfiles,
  updateUserRole
} from '@/lib/db';
import type { Tree, JoinRequest, Profile } from '@/types';
import { Loader2, Plus, TreeDeciduous, ChevronRight, LayoutDashboard, LogOut, Search, UserPlus, Check, X, ShieldAlert, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ToastProvider, useToast } from '@/components/ui/Toast';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <DashboardContent />
      </ToastProvider>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, profile, role, signOut } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'yours' | 'discover' | 'approvals' | 'roles'>('yours');
  
  // Data states
  const [trees, setTrees] = useState<Tree[]>([]);
  const [publicTrees, setPublicTrees] = useState<Tree[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Create tree state
  const [isCreating, setIsCreating] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Discover state
  const [searchQuery, setSearchQuery] = useState('');
  const [requesting, setRequesting] = useState<string | null>(null);
  
  // Action state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingClaim, setProcessingClaim] = useState<string | null>(null);
  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setDataError(null);
      const [uTrees, pTrees, reqs, approvals, claims] = await Promise.all([
        getUserTrees(user.id, role),
        getAllPublicTrees(),
        getUserJoinRequests(user.id),
        getPendingRequestsForOwner(),
        getPendingClaimsForAdmin()
      ]);
      
      let allProfiles: Profile[] = [];
      if (role === 'admin') {
        allProfiles = await getAllProfiles();
      }

      setTrees(uTrees);
      setPublicTrees(pTrees);
      setMyRequests(reqs);
      setPendingApprovals(approvals);
      setPendingClaims(claims);
      setProfiles(allProfiles);
    } catch (err: any) {
      console.error(err);
      setDataError(err.message || 'Unknown error occurred');
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTreeName.trim()) return;
    setCreating(true);
    try {
      const tree = await createTree(newTreeName.trim(), user.id);
      router.push(`/tree?id=${tree.id}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to create tree', 'error');
      setCreating(false);
    }
  };

  const handleRequestJoin = async (treeId: string) => {
    if (!user) return;
    setRequesting(treeId);
    try {
      await requestJoinTree(treeId, user.id);
      showToast('Join request sent successfully!');
      loadData(); // reload to update status
    } catch (err) {
      showToast('Failed to send request', 'error');
    } finally {
      setRequesting(null);
    }
  };

  const handleApproveReject = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessingId(requestId);
    try {
      await updateRequestStatus(requestId, status);
      showToast(`Request ${status}`);
      loadData();
    } catch (err) {
      showToast('Failed to update request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessClaim = async (claimId: string, action: 'approve' | 'reject') => {
    setProcessingClaim(claimId);
    try {
      if (action === 'approve') {
        await approveProfileClaim(claimId);
        showToast('Claim approved successfully');
      } else {
        await rejectProfileClaim(claimId);
        showToast('Claim rejected');
      }
      loadData();
    } catch (err) {
      showToast('Failed to process claim', 'error');
    } finally {
      setProcessingClaim(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen-safe flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">{dataError}</p>
        <Button onClick={loadData} className="mt-6">Try Again</Button>
      </div>
    );
  }

  // Filter public trees to exclude ones the user already owns or has joined
  const filteredPublicTrees = publicTrees.filter(pt => 
    !trees.some(t => t.id === pt.id) &&
    pt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen-safe bg-slate-50 dark:bg-slate-950 px-4 py-8 relative">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-8 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <BrandLogo size={36} />
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">VamshaVrksha</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 mt-0.5">{role}</p>
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto animate-fade-in-up">
        {/* Profile Claim Banner */}
        {!loading && profile && !profile.self_person_id && (trees.length > 0 || role === 'admin') && (
          <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-brand-900 dark:text-brand-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-500" />
                Claim Your Profile
              </h2>
              <p className="text-sm text-brand-700 dark:text-brand-300 mt-1 max-w-lg">
                Have you already been added to a family tree by a relative? Claim your profile to automatically join their tree and link your account.
              </p>
            </div>
            <Button onClick={() => router.push('/claim')} className="shrink-0 bg-brand-600 hover:bg-brand-700 text-white">
              Find My Profile <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('yours')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === 'yours' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200/50 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            Your Trees
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'discover' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200/50 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Search className="w-4 h-4" /> Discover Trees
          </button>
          {(pendingApprovals.length > 0 || pendingClaims.length > 0) && (
            <button 
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40'}`}
            >
              <ShieldAlert className="w-4 h-4" /> Pending Approvals ({pendingApprovals.length + pendingClaims.length})
            </button>
          )}
          {role === 'admin' && (
            <button 
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'roles' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200/50 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            >
              <Shield className="w-4 h-4" /> Manage Roles
            </button>
          )}
        </div>

        {/* Tab Content: YOUR TREES */}
        {activeTab === 'yours' && (
          <div className="space-y-6 animate-fade-in">
            {role === 'admin' && (
              isCreating ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Create New Tree</h2>
                  <form onSubmit={handleCreateTree} className="flex gap-3">
                    <Input 
                      value={newTreeName}
                      onChange={(e) => setNewTreeName(e.target.value)}
                      placeholder="e.g. The Johnson Family"
                      className="flex-1"
                      autoFocus
                      required
                    />
                    <Button type="submit" loading={creating} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Create
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                  </form>
                </div>
              ) : (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full bg-blue-50/50 dark:bg-blue-900/10 border border-dashed border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-semibold">Start a New Family Tree</span>
                </button>
              )
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trees.length === 0 && !isCreating && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                  <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 text-brand-500 rounded-2xl flex items-center justify-center mb-6">
                    <TreeDeciduous className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Welcome to VamshaVrksha!</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                    You don't have access to any family trees yet. Here is how you can get started:
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl">
                    <button onClick={() => router.push('/claim')} className="flex flex-col items-center text-center p-6 rounded-2xl border-2 border-brand-100 dark:border-brand-900/30 hover:border-brand-500 dark:hover:border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 transition-all group">
                      <UserPlus className="w-8 h-8 text-brand-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Claim Your Profile</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">If your family has already added you to a tree, link your account here.</p>
                    </button>

                    <button onClick={() => setActiveTab('discover')} className="flex flex-col items-center text-center p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/30 transition-all group">
                      <Search className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Discover Trees</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Search for public family trees and request to join them.</p>
                    </button>
                  </div>
                </div>
              )}
              {trees.map(tree => (
                <button 
                  key={tree.id}
                  onClick={() => router.push(`/tree?id=${tree.id}`)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <TreeDeciduous className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{tree.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tree.owner_id === user?.id ? 'Owner' : 'Member'} · Created {new Date(tree.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: DISCOVER TREES */}
        {activeTab === 'discover' && (
          <div className="space-y-6 animate-fade-in">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a family tree by name..."
                className="pl-12 py-3 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-lg shadow-sm"
              />
            </div>
            
            <div className="space-y-3">
              {filteredPublicTrees.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No trees found matching your search.</p>
                </div>
              )}
              {filteredPublicTrees.map(tree => {
                const requestStatus = myRequests.find(r => r.tree_id === tree.id)?.status;
                
                return (
                  <div key={tree.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <TreeDeciduous className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{tree.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Created {new Date(tree.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {requestStatus === 'pending' ? (
                      <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-200/50 dark:border-amber-900/50">
                        Pending
                      </span>
                    ) : requestStatus === 'rejected' ? (
                      <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs font-bold uppercase tracking-wider border border-red-200/50 dark:border-red-900/50">
                        Rejected
                      </span>
                    ) : (
                      <Button 
                        onClick={() => handleRequestJoin(tree.id)} 
                        loading={requesting === tree.id}
                        size="sm"
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                      >
                        <UserPlus className="w-4 h-4 mr-1.5" /> Request to Join
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content: PENDING APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="space-y-6 animate-fade-in">
            {pendingApprovals.length === 0 && pendingClaims.length === 0 ? (
              <div className="py-12 text-center">
                <Check className="w-12 h-12 text-emerald-400 dark:text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">You're all caught up!</p>
                <p className="text-sm text-slate-400 mt-1">No pending requests.</p>
              </div>
            ) : (
              <>
                {/* Profile Claims */}
                {pendingClaims.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1">Profile Claims</h3>
                    <div className="space-y-3">
                      {pendingClaims.map(claim => (
                        <div key={claim.id} className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-900/30 rounded-2xl p-5 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {claim.persons?.first_name} {claim.persons?.last_name || ''}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                User wants to claim this profile
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => handleProcessClaim(claim.id, 'reject')}
                                loading={processingClaim === claim.id}
                                disabled={processingClaim !== null && processingClaim !== claim.id}
                                variant="secondary"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4 mr-1" /> Deny
                              </Button>
                              <Button 
                                onClick={() => handleProcessClaim(claim.id, 'approve')}
                                loading={processingClaim === claim.id}
                                disabled={processingClaim !== null && processingClaim !== claim.id}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Join Requests */}
                {pendingApprovals.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-1 mt-6">Tree Join Requests</h3>
                    <div className="space-y-3">
                      {pendingApprovals.map(req => (
                        <div key={req.id} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {req.user.first_name} {req.user.last_name || ''} 
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({req.user.email})</span>
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                wants to join <strong className="text-slate-900 dark:text-slate-100">{req.tree.name}</strong>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wider font-bold">
                                Requested {new Date(req.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => handleApproveReject(req.id, 'rejected')} 
                                loading={processingId === req.id}
                                disabled={processingId !== null && processingId !== req.id}
                                variant="secondary"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4 mr-1" /> Deny
                              </Button>
                              <Button 
                                onClick={() => handleApproveReject(req.id, 'approved')} 
                                loading={processingId === req.id}
                                disabled={processingId !== null && processingId !== req.id}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab Content: MANAGE ROLES */}
        {activeTab === 'roles' && role === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" /> Manage User Roles
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Assign editing permissions or promote other users to administrators.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto pr-2">
                {profiles.map((p) => {
                  const isSelf = p.id === user?.id;
                  return (
                    <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {p.first_name || 'No Name'} {p.last_name || ''}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.email}</p>
                      </div>

                      <select
                        value={p.role || 'viewer'}
                        disabled={isSelf || updatingUserRole === p.id}
                        onChange={async (e) => {
                          const newRole = e.target.value as 'admin' | 'editor' | 'viewer';
                          setUpdatingUserRole(p.id);
                          try {
                            await updateUserRole(p.id, newRole);
                            setProfiles((prev) =>
                              prev.map((item) => (item.id === p.id ? { ...item, role: newRole } : item))
                            );
                            showToast(`Updated role for ${p.email} to ${newRole}`);
                          } catch (err) {
                            showToast('Failed to update role', 'error');
                          } finally {
                            setUpdatingUserRole(null);
                          }
                        }}
                        className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
