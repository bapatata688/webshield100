import React, { useState, useEffect } from 'react';
import {
  Shield, LogOut, Home, User, Loader2, FolderPlus, Trash2,
  FileCode, Search, Edit2, Check, X
} from 'lucide-react';
import { projectsAPI, loadPaymentHistory } from '../api/config.js';
import '../App.css'

const DashboardScreen = ({ user, projects, setProjects, onProjectSelect, onLogout, searchQuery, setSearchQuery, loading, setLoading, onNavigateToPlans }) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [paymentHistory, setPaymentHistory] = useState([]);

  const ProjectsTab = () => {
    const [filteredProjects, setFilteredProjects] = useState(projects);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    useEffect(() => {
      if (searchQuery.trim()) {
        const filtered = projects.filter(project =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProjects(filtered);
      } else {
        setFilteredProjects(projects);
      }
    }, [searchQuery, projects]);

    const createNewProject = async () => {
      try {
        setLoading(true);
        const response = await projectsAPI.create({ name: 'Nuevo Proyecto' });
        setProjects([response.project, ...projects]);
        onProjectSelect(response.project);
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    const deleteProject = async (projectId) => {
      if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
        try {
          await projectsAPI.delete(projectId);
          setProjects(projects.filter(p => p.id !== projectId));
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    };

    const startRenaming = (project) => {
      setEditingId(project.id);
      setEditingName(project.name);
    };

    const cancelRenaming = () => {
      setEditingId(null);
      setEditingName('');
    };

    const saveRename = async (projectId) => {
      if (!editingName.trim()) {
        alert('El nombre no puede estar vacío');
        return;
      }

      if (editingName === projects.find(p => p.id === projectId)?.name) {
        cancelRenaming();
        return;
      }

      try {
        setIsRenaming(true);
        await projectsAPI.update(projectId, { name: editingName.trim() });

        // Actualizar el proyecto en el estado local
        setProjects(projects.map(p =>
          p.id === projectId ? { ...p, name: editingName.trim() } : p
        ));

        cancelRenaming();
      } catch (error) {
        alert(`Error renombrando: ${error.message}`);
      } finally {
        setIsRenaming(false);
      }
    };

    const handleKeyDown = (e, projectId) => {
      if (e.key === 'Enter') {
        saveRename(projectId);
      } else if (e.key === 'Escape') {
        cancelRenaming();
      }
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mis Proyectos</h2>
          <button
            onClick={createNewProject}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center disabled:opacity-50 hover:shadow-lg transform hover:scale-105"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FolderPlus className="w-4 h-4 mr-2" />
            )}
            Nuevo Proyecto
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 animate-fade-in">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando proyectos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <FileCode className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hay proyectos</h3>
            <p className="text-gray-600 mb-6">Crea tu primer proyecto para comenzar</p>
            <button
              onClick={createNewProject}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            >
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  {editingId === project.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, project.id)}
                        disabled={isRenaming}
                        className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => saveRename(project.id)}
                        disabled={isRenaming}
                        className="text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                        title="Guardar"
                      >
                        {isRenaming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={cancelRenaming}
                        disabled={isRenaming}
                        className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-900 truncate flex-1">
                        {project.name}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startRenaming(project)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Renombrar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <p>Creado: {new Date(project.created_at).toLocaleDateString()}</p>
                  <p>Modificado: {new Date(project.updated_at).toLocaleDateString()}</p>
                </div>

                <button
                  onClick={() => onProjectSelect(project)}
                  disabled={editingId === project.id}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-105"
                >
                  Abrir Editor
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const AccountTab = () => {
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);

    useEffect(() => {
      if (showPaymentHistory && paymentHistory.length === 0) {
        loadPaymentHistory().then(response => {
          setPaymentHistory(response.payments);
        }).catch(error => {
          console.error('Error loading payment history:', error);
        });
      }
    }, [showPaymentHistory]);

    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Cuenta</h2>
          <p className="text-gray-600">Configuración de perfil y facturación</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 transition-all duration-300 hover:shadow-md animate-slide-up">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Actual</label>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${user?.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                    user?.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                    {user?.plan?.toUpperCase()}
                  </span>
                  {user?.plan === 'free' && (
                    <button
                      onClick={onNavigateToPlans}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-all duration-200 hover:underline"
                    >
                      Actualizar Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 transition-all duration-300 hover:shadow-md animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Historial de Pagos</h3>
              <button
                onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-all duration-200 hover:underline"
              >
                {showPaymentHistory ? 'Ocultar' : 'Ver Historial'}
              </button>
            </div>

            {showPaymentHistory && (
              <div className="space-y-4 animate-fade-in">
                {paymentHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay pagos registrados</p>
                ) : (
                  paymentHistory.map((payment) => (
                    <div key={payment.id} className="border-b pb-3 transition-all duration-200 hover:bg-gray-50 px-2 -mx-2 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">${payment.amount}</span>
                        <span className={`px-2 py-1 text-xs rounded-full transition-all duration-200 ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                          }`}>
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3 animate-pulse-slow" />
              <h1 className="text-xl font-bold text-gray-900">WebShield</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Hola, {user?.email}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${user?.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                  user?.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                  {user?.plan?.toUpperCase()}
                </span>
                <button
                  onClick={onLogout}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:rotate-12 transform"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${activeTab === 'projects'
              ? 'bg-white text-blue-600 shadow-sm transform scale-105'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Proyectos
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${activeTab === 'account'
              ? 'bg-white text-blue-600 shadow-sm transform scale-105'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Cuenta
          </button>
        </div>

        {activeTab === 'projects' && <ProjectsTab />}
        {activeTab === 'account' && <AccountTab />}
      </div>

      {/* <style jsx>{` */}
      {/*   @keyframes fade-in { */}
      {/*     from { */}
      {/*       opacity: 0; */}
      {/*     } */}
      {/*     to { */}
      {/*       opacity: 1; */}
      {/*     } */}
      {/*   } */}
      {/**/}
      {/*   @keyframes slide-up { */}
      {/*     from { */}
      {/*       opacity: 0; */}
      {/*       transform: translateY(20px); */}
      {/*     } */}
      {/*     to { */}
      {/*       opacity: 1; */}
      {/*       transform: translateY(0); */}
      {/*     } */}
      {/*   } */}
      {/**/}
      {/*   @keyframes pulse-slow { */}
      {/*     0%, 100% { */}
      {/*       opacity: 1; */}
      {/*     } */}
      {/*     50% { */}
      {/*       opacity: 0.8; */}
      {/*     } */}
      {/*   } */}
      {/**/}
      {/*   .animate-fade-in { */}
      {/*     animation: fade-in 0.3s ease-out; */}
      {/*   } */}
      {/**/}
      {/*   .animate-slide-up { */}
      {/*     animation: slide-up 0.4s ease-out; */}
      {/*     animation-fill-mode: both; */}
      {/*   } */}
      {/**/}
      {/*   .animate-pulse-slow { */}
      {/*     animation: pulse-slow 3s ease-in-out infinite; */}
      {/*   } */}
      {/* `}</style> */}
    </div>
  );
};

export default DashboardScreen;
