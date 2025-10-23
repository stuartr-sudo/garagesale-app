import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TodoList({ userId }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  });
  const { toast } = useToast();

  // Fetch todos
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/baggage-todos?user_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTodos(data.todos || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch todos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch todos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new todo
  const handleCreateTodo = async (e) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/baggage-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTodo,
          due_date: newTodo.due_date || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTodos([data.todo, ...todos]);
        setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' });
        setShowAddDialog(false);
        toast({
          title: "Success",
          description: "Todo created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create todo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      toast({
        title: "Error",
        description: "Failed to create todo",
        variant: "destructive"
      });
    }
  };

  // Toggle todo completion
  const handleToggleComplete = async (todo) => {
    try {
      const response = await fetch('/api/baggage-todos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: todo.id,
          completed: !todo.completed
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTodos(todos.map(t => 
          t.id === todo.id 
            ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }
            : t
        ));
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update todo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive"
      });
    }
  };

  // Delete todo
  const handleDeleteTodo = async (todoId) => {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    try {
      const response = await fetch('/api/baggage-todos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: todoId }),
      });

      if (response.ok) {
        setTodos(todos.filter(t => t.id !== todoId));
        toast({
          title: "Success",
          description: "Todo deleted successfully",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete todo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast({
        title: "Error",
        description: "Failed to delete todo",
        variant: "destructive"
      });
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-3 h-3" />;
      case 'medium': return <Clock className="w-3 h-3" />;
      case 'low': return <CheckCircle2 className="w-3 h-3" />;
      default: return <Star className="w-3 h-3" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  // Check if todo is overdue
  const isOverdue = (todo) => {
    if (!todo.due_date || todo.completed) return false;
    return new Date(todo.due_date) < new Date();
  };

  useEffect(() => {
    if (userId) {
      fetchTodos();
    }
  }, [userId]);

  const completedTodos = todos.filter(todo => todo.completed);
  const pendingTodos = todos.filter(todo => !todo.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">To-Do List</h2>
          <p className="text-gray-400">Manage your baggage-related tasks</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Todo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Todo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium">Title *</label>
                <Input
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  placeholder="Enter todo title"
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="text-gray-300 text-sm font-medium">Description</label>
                <Textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium">Priority</label>
                  <Select value={newTodo.priority} onValueChange={(value) => setNewTodo({ ...newTodo, priority: value })}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="low" className="text-white">Low</SelectItem>
                      <SelectItem value="medium" className="text-white">Medium</SelectItem>
                      <SelectItem value="high" className="text-white">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newTodo.due_date}
                    onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create Todo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{todos.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{pendingTodos.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{completedTodos.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Todos */}
      {pendingTodos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            {pendingTodos.map((todo) => (
              <Card 
                key={todo.id} 
                className={`bg-gray-800 border-gray-700 ${isOverdue(todo) ? 'border-red-500' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                          {todo.title}
                        </h4>
                        <Badge className={`${getPriorityColor(todo.priority)} text-white text-xs`}>
                          {getPriorityIcon(todo.priority)}
                          <span className="ml-1 capitalize">{todo.priority}</span>
                        </Badge>
                        {isOverdue(todo) && (
                          <Badge className="bg-red-500 text-white text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      {todo.description && (
                        <p className={`text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                          {todo.description}
                        </p>
                      )}
                      
                      {todo.due_date && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className={`text-xs ${isOverdue(todo) ? 'text-red-400' : 'text-gray-400'}`}>
                            Due: {formatDate(todo.due_date)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Completed Tasks</h3>
          <div className="space-y-3">
            {completedTodos.map((todo) => (
              <Card key={todo.id} className="bg-gray-800 border-gray-700 opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="line-through text-gray-500 font-medium">
                          {todo.title}
                        </h4>
                        <Badge className="bg-green-500 text-white text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                      
                      {todo.description && (
                        <p className="line-through text-gray-500 text-sm">
                          {todo.description}
                        </p>
                      )}
                      
                      {todo.completed_at && (
                        <div className="flex items-center space-x-1 mt-2">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400">
                            Completed: {formatDate(todo.completed_at)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {todos.length === 0 && !loading && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No todos yet</h3>
            <p className="text-gray-400 mb-4">Create your first to-do item to get started</p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Todo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
