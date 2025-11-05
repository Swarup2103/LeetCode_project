import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../utils/axiosClient";

// Reusable component for a dynamic field array section with professional styling
const FieldArraySection = ({ control, register, name, legend, fieldsConfig, appendValue }) => {
    const { fields, append, remove } = useFieldArray({ control, name });

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{legend}</h3>
                <button 
                    type="button" 
                    onClick={() => append(appendValue)} 
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add {legend.replace(/s$/, '')}
                </button>
            </div>
            
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-gray-700">{legend.slice(0, -1)} #{index + 1}</span>
                            <button 
                                type="button" 
                                onClick={() => remove(index)} 
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fieldsConfig.map(config => (
                                <div key={config.name} className={fieldsConfig.length === 1 ? "col-span-2" : ""}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {config.label}
                                    </label>
                                    {config.type === 'textarea' ? (
                                        <textarea 
                                            {...register(`${name}.${index}.${config.name}`)} 
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                                            rows={config.rows || 4}
                                        />
                                    ) : (
                                        <input 
                                            {...register(`${name}.${index}.${config.name}`)} 
                                            type="text" 
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                
                {fields.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No {legend.toLowerCase()}</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating your first one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

function UpdateProblem() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm();
    
    // Get the 'replace' function from each useFieldArray hook
    const { replace: replaceVisible } = useFieldArray({ control, name: "visibleTestCases" });
    const { replace: replaceHidden } = useFieldArray({ control, name: "hiddenTestCases" });
    const { replace: replaceStartCode } = useFieldArray({ control, name: "startCode" });
    const { replace: replaceRefSol } = useFieldArray({ control, name: "referenceSolution" });

    useEffect(() => {
        const fetchProblemData = async () => {
            try {
                const response = await axiosClient.get(`/problem/problemById/${id}`);
                const problemData = response.data;
                
                reset(problemData); 
                
                // Manually call 'replace' for each field array
                replaceVisible(problemData.visibleTestCases || []);
                replaceHidden(problemData.hiddenTestCases || []);
                replaceStartCode(problemData.startCode || []);
                replaceRefSol(problemData.referenceSolution || []);

            } catch (error) {
                console.error("Failed to fetch problem data:", error);
                alert("Could not load the problem data.");
                navigate('/admin');
            }
        };
        fetchProblemData();
    }, [id, reset, navigate, replaceVisible, replaceHidden, replaceStartCode, replaceRefSol]);

    const onSubmit = async (data) => {
        try {
            await axiosClient.patch(`/problem/update/${id}`, data);
            alert("Problem updated successfully!");
            navigate('/admin');
        } catch (error) {
            console.error("Failed to update problem:", error);
            alert("Error: " + (error.response?.data?.message || "Could not update the problem."));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Problem</h1>
                    
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Basic Information Card */}
                    <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                            
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Title *
                                </label>
                                <input
                                    id="title"
                                    {...register("title", { required: "Title is required" })}
                                    type="text"
                                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                        errors.title ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter problem title"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                                )}
                            </div>
                            
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    {...register("description", { required: "Description is required" })}
                                    rows={6}
                                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                        errors.description ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Provide a detailed description of the problem (Markdown supported)"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                                        Difficulty
                                    </label>
                                    <select
                                        id="difficulty"
                                        {...register("difficulty")}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tag
                                    </label>
                                    <select
                                        id="tags"
                                        {...register("tags")}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="array">Array</option>
                                        <option value="string">String</option>
                                        <option value="linked list">Linked List</option>
                                        <option value="tree">Tree</option>
                                        <option value="graph">Graph</option>
                                        <option value="dynamic programming">Dynamic Programming</option>
                                        <option value="backtracking">Backtracking</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Sections */}
                    <FieldArraySection
                        control={control}
                        register={register}
                        name="visibleTestCases"
                        legend="Visible Test Cases"
                        fieldsConfig={[
                            { name: 'input', label: 'Input', type: 'textarea', rows: 3 },
                            { name: 'output', label: 'Output', type: 'textarea', rows: 3 },
                            { name: 'explanation', label: 'Explanation', type: 'textarea', rows: 3 },
                        ]}
                        appendValue={{ input: '', output: '', explanation: '' }}
                    />

                    <FieldArraySection
                        control={control}
                        register={register}
                        name="hiddenTestCases"
                        legend="Hidden Test Cases"
                        fieldsConfig={[
                            { name: 'input', label: 'Input', type: 'textarea', rows: 4 },
                            { name: 'output', label: 'Output', type: 'textarea', rows: 4 },
                        ]}
                        appendValue={{ input: '', output: '' }}
                    />
                    
                    <FieldArraySection
                        control={control}
                        register={register}
                        name="startCode"
                        legend="Starter Code"
                        fieldsConfig={[
                            { name: 'language', label: 'Language (e.g., javascript, python, java)', type: 'input' },
                            { name: 'initialCode', label: 'Initial Code Snippet', type: 'textarea', rows: 6 },
                        ]}
                        appendValue={{ language: '', initialCode: '' }}
                    />

                    <FieldArraySection
                        control={control}
                        register={register}
                        name="referenceSolution"
                        legend="Reference Solutions"
                        fieldsConfig={[
                            { name: 'language', label: 'Language (e.g., javascript, python, java)', type: 'input' },
                            { name: 'completeCode', label: 'Complete Solution Code', type: 'textarea', rows: 8 },
                        ]}
                        appendValue={{ language: '', completeCode: '' }}
                    />

                    {/* Form Actions */}
                    <div className="bg-white shadow rounded-lg p-6 mt-6">
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate('/admin')}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Update Problem
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdateProblem;