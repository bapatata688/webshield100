// components/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, Home, User, Loader2, FolderPlus, Trash2, 
  FileCode, Search 
} from 'lucide-react';
import { projectsAPI, loadPaymentHistory } from '../api/config.js';

const DashboardScreen = ({ user, projects, setProjects, onProjectSelect, onLogout, searchQuery, setSearchQuery, loading, setLoading }) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [paymentHistory, setPaymentHistory] = useState([]);

  const ProjectsTab = () => {
    const [filteredProjects, setFilteredProjects] = useState(projects);

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

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mis Proyectos</h2>
          <button
            onClick={createNewProject}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
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
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando proyectos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FileCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hay proyectos</h3>
            <p className="text-gray-600 mb-6">Crea tu primer proyecto para comenzar</p>
            <button
              onClick={createNewProject}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{project.name}</h3>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <p>Creado: {new Date(project.created_at).toLocaleDateString()}</p>
                  <p>Modificado: {new Date(project.updated_at).toLocaleDateString()}</p>
                </div>

                <button
                  onClick={() => onProjectSelect(project)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Cuenta</h2>
          <p className="text-gray-600">Configuración de perfil y facturación</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user?.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                    user?.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {user?.plan?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Historial de Pagos</h3>
              <button
                onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showPaymentHistory ? 'Ocultar' : 'Ver Historial'}
              </button>
            </div>

            {showPaymentHistory && (
              <div className="space-y-4">
                {paymentHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay pagos registrados</p>
                ) : (
                  paymentHistory.map((payment) => (
                    <div key={payment.id} className="border-b pb-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">${payment.amount}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
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
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">WebShield</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Hola, {user?.email}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user?.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                  user?.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {user?.plan?.toUpperCase()}
                </span>
                <button
                  onClick={onLogout}
                  className="text-gray-400 hover:text-gray-600"
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
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'projects' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Proyectos
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'account' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Cuenta
          </button>
        </div>

        {activeTab === 'projects' && <ProjectsTab />}
        {activeTab === 'account' && <AccountTab />}
      </div>
    </div>
  );
};

export default DashboardScreen;
