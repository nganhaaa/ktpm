import React, { useState, useEffect } from 'react';
import {
  FaPlus,
  FaSearch,
  FaPen,
  FaTrashAlt,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import MainLayout from '../../Layout/MainLayout';
import { 
  HoKhau, 
  fetchAllHoKhau, 
  fetchHoKhauById, 
  createHoKhau, 
  updateHoKhau, 
  deleteHoKhau 
} from '../../api/HoKhauApi';

// Interface for form data
interface EditFormData {
  chuHo: number;
  soNha: string;
  ngayLap: string;
  ngayCapNhat?: string;
  dienTich: number;
  loaiThayDoi: number;
}

// Utility functions
const formatDateISO = (dateStr: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return '';
};

const formatDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy}`;
  }
  return dateStr;
};

const QLHoKhau: React.FC = () => {
  const [data, setData] = useState<HoKhau[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    chuHo: 0,
    soNha: '',
    ngayLap: '',
    ngayCapNhat: '',
    dienTich: 0,
    loaiThayDoi: 1
  });
  const [addingNew, setAddingNew] = useState<boolean>(false);
  const [newRowData, setNewRowData] = useState<EditFormData>({
    chuHo: 0,
    soNha: '',
    ngayLap: '',
    ngayCapNhat: '',
    dienTich: 0,
    loaiThayDoi: 1
  });

  const [searchCriteria, setSearchCriteria] = useState<string>('0');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Fetch data from API
  useEffect(() => {
    loadHoKhau();
  }, []);

  const loadHoKhau = async () => {
    try {
      setLoading(true);
      const response = await fetchAllHoKhau();
      // Handle stringified JSON response
      let fetchedData: HoKhau[] = response.data;
      if (typeof response.data === 'string') {
        try {
          fetchedData = JSON.parse(response.data);
        } catch (parseError) {
          console.error('Error parsing response data:', parseError);
          setError('Dữ liệu trả về từ API không thể phân tích.');
          setData([]);
          setLoading(false);
          return;
        }
      }

      // Ensure fetchedData is an array
      if (Array.isArray(fetchedData)) {
        setData(fetchedData);
        console.log('Fetched ho khau data:', fetchedData);
        setError('');
      } else {
        console.error('Response data is not an array:', fetchedData);
        setData([]);
        setError('Dữ liệu trả về từ API không đúng định dạng.');
      }
    } catch (err: any) {
      console.error('Error loading ho khau:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu: ' + (err.response?.data?.message || err.message));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit click
  const handleEditClick = async (row: HoKhau): Promise<void> => {
    if (editRowId === row.maHoKhau) {
      // Save changes
      try {
        const updateData: HoKhau = {
          chuHo: editFormData.chuHo,
          soNha: editFormData.soNha,
          ngayLap: formatDateISO(editFormData.ngayLap),
          ngayCapNhat: editFormData.ngayCapNhat ? formatDateISO(editFormData.ngayCapNhat) : undefined,
          dienTich: editFormData.dienTich
        };
        
        await updateHoKhau(row.maHoKhau!, updateData, editFormData.loaiThayDoi, editFormData.chuHo);
        await loadHoKhau();
        setEditRowId(null);
        setEditFormData({
          chuHo: 0,
          soNha: '',
          ngayLap: '',
          ngayCapNhat: '',
          dienTich: 0,
          loaiThayDoi: 1
        });
      } catch (err: any) {
        alert('Có lỗi xảy ra khi cập nhật: ' + (err.response?.data?.message || err.message));
        console.error('Error updating ho khau:', err);
      }
    } else {
      // Start editing
      setEditRowId(row.maHoKhau!);
      setEditFormData({
        chuHo: row.chuHo,
        soNha: row.soNha,
        ngayLap: formatDateDisplay(row.ngayLap),
        ngayCapNhat: formatDateDisplay(row.ngayCapNhat),
        dienTich: row.dienTich,
        loaiThayDoi: 2 // Assume update operation
      });
    }
  };

  // Handle delete click
  const handleDeleteClick = async (id: number): Promise<void> => {
    if (window.confirm('Bạn có chắc muốn xóa hộ khẩu này?')) {
      try {
        await deleteHoKhau(id);
        await loadHoKhau();
        if (editRowId === id) {
          setEditRowId(null);
          setEditFormData({
            chuHo: 0,
            soNha: '',
            ngayLap: '',
            ngayCapNhat: '',
            dienTich: 0,
            loaiThayDoi: 1
          });
        }
      } catch (err: any) {
        alert('Có lỗi xảy ra khi xóa: ' + (err.response?.data?.message || err.message));
        console.error('Error deleting ho khau:', err);
      }
    }
  };

  // Handle edit input change
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ 
      ...prev, 
      [name]: name === 'chuHo' || name === 'dienTich' || name === 'loaiThayDoi' ? Number(value) : value 
    }));
  };

  // Handle add new click
  const handleAddNewClick = (): void => {
    setAddingNew(true);
    setNewRowData({
      chuHo: 0,
      soNha: '',
      ngayLap: '',
      ngayCapNhat: '',
      dienTich: 0,
      loaiThayDoi: 1
    });
  };

  // Handle new row input change
  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setNewRowData(prev => ({ 
      ...prev, 
      [name]: name === 'chuHo' || name === 'dienTich' || name === 'loaiThayDoi' ? Number(value) : value 
    }));
  };

  // Save new row
  const handleSaveNewRow = async (): Promise<void> => {
    if (!newRowData.soNha.trim()) {
      alert('Vui lòng nhập số nhà.');
      return;
    }
    if (!newRowData.chuHo) {
      alert('Vui lòng nhập mã chủ hộ.');
      return;
    }
    if (!newRowData.ngayLap.trim()) {
      alert('Vui lòng nhập ngày lập.');
      return;
    }
    if (!newRowData.dienTich) {
      alert('Vui lòng nhập diện tích.');
      return;
    }
    if (!newRowData.loaiThayDoi) {
      alert('Vui lòng chọn loại thay đổi.');
      return;
    }

    try {
      const newHoKhau: HoKhau = {
        chuHo: newRowData.chuHo,
        soNha: newRowData.soNha,
        ngayLap: formatDateISO(newRowData.ngayLap),
        ngayCapNhat: newRowData.ngayCapNhat ? formatDateISO(newRowData.ngayCapNhat) : undefined,
        dienTich: newRowData.dienTich
      };
      
      await createHoKhau(newHoKhau, newRowData.loaiThayDoi);
      await loadHoKhau();
      setAddingNew(false);
      setNewRowData({
        chuHo: 0,
        soNha: '',
        ngayLap: '',
        ngayCapNhat: '',
        dienTich: 0,
        loaiThayDoi: 1
      });
    } catch (err: any) {
      alert('Có lỗi xảy ra khi tạo hộ khẩu: ' + (err.response?.data?.message || err.message));
      console.error('Error creating ho khau:', err);
    }
  };

  // Cancel new row
  const handleCancelNewRow = (): void => {
    setAddingNew(false);
    setNewRowData({
      chuHo: 0,
      soNha: '',
      ngayLap: '',
      ngayCapNhat: '',
      dienTich: 0,
      loaiThayDoi: 1
    });
  };

  // Handle search
  const handleSearch = (): void => {
    if (!searchKeyword.trim()) {
      alert('Vui lòng nhập từ khóa tìm kiếm.');
      return;
    }
    const crit = parseInt(searchCriteria, 10);
    const found = data.find(item => {
      const fields = [
        item.maHoKhau?.toString() || '',
        item.chuHo.toString(),
        item.soNha,
        formatDateDisplay(item.ngayLap),
        formatDateDisplay(item.ngayCapNhat),
        item.dienTich.toString(),
        item.danhSachNhanKhau?.length.toString() || '0'
      ];
      return fields[crit]?.toLowerCase().includes(searchKeyword.toLowerCase());
    });
    
    if (found) {
      setHighlightedRowId(found.maHoKhau!);
      setTimeout(() => setHighlightedRowId(null), 3000);
      document.getElementById(`row-${found.maHoKhau}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert('Không tìm thấy hộ khẩu phù hợp.');
    }
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="sr-only">Đang tải...</span>
            </div>
            <p className="mt-2">Đang tải dữ liệu...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button 
              onClick={loadHoKhau}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quản lý hộ khẩu</h2>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchCriteria}
                onChange={e => setSearchCriteria(e.target.value)}
              >
                <option value="0">Mã hộ khẩu</option>
                <option value="1">Mã chủ hộ</option>
                <option value="2">Số nhà</option>
                <option value="3">Ngày lập</option>
                <option value="4">Ngày cập nhật</option>
                <option value="5">Diện tích</option>
                {/* <option value="6">Số nhân khẩu</option> */}
              </select>
              <input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                onClick={handleSearch}
              >
                <FaSearch />
                <span>Tìm kiếm</span>
              </button>
            </div>

            <button 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              onClick={handleAddNewClick}
            >
              <FaPlus />
              <span>Tạo mới</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã hộ khẩu</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã chủ hộ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Số nhà</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày lập</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày cập nhật</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Diện tích</th>
                  {/* <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Số nhân khẩu</th> */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map(row => (
                  <tr
                    key={row.maHoKhau}
                    id={`row-${row.maHoKhau}`}
                    className={`hover:bg-gray-50 ${highlightedRowId === row.maHoKhau ? 'bg-yellow-100' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">{row.maHoKhau}</td>
                    {editRowId === row.maHoKhau ? (
                      <>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            name="chuHo" 
                            value={editFormData.chuHo} 
                            onChange={handleEditChange} 
                            className="w-full px-2 py-1 border rounded" 
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            name="soNha" 
                            value={editFormData.soNha} 
                            onChange={handleEditChange} 
                            className="w-full px-2 py-1 border rounded" 
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            name="ngayLap" 
                            value={editFormData.ngayLap} 
                            onChange={handleEditChange} 
                            placeholder="DD/MM/YYYY"
                            className="w-full px-2 py-1 border rounded" 
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            name="ngayCapNhat" 
                            value={editFormData.ngayCapNhat || ''} 
                            onChange={handleEditChange} 
                            placeholder="DD/MM/YYYY"
                            className="w-full px-2 py-1 border rounded" 
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            name="dienTich" 
                            value={editFormData.dienTich} 
                            onChange={handleEditChange} 
                            className="w-full px-2 py-1 border rounded" 
                          />
                        </td>
                        {/* <td className="px-4 py-3">
                          <select
                            name="loaiThayDoi"
                            value={editFormData.loaiThayDoi}
                            onChange={handleEditChange}
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value={1}>Tạo mới</option>
                            <option value={2}>Cập nhật</option>
                          </select>
                        </td> */}
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.chuHo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.soNha}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDateDisplay(row.ngayLap)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDateDisplay(row.ngayCapNhat)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.dienTich}</td>
                        {/* <td className="px-4 py-3 text-sm text-gray-900">{row.danhSachNhanKhau?.length || 0}</td> */}
                      </>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          onClick={() => handleEditClick(row)}
                          title={editRowId === row.maHoKhau ? "Lưu" : "Chỉnh sửa"}
                        >
                          {editRowId === row.maHoKhau ? <FaSave /> : <FaPen />}
                        </button>
                        <button 
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          onClick={() => handleDeleteClick(row.maHoKhau!)}
                          title="Xóa"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {addingNew && (
                  <tr className="bg-blue-50">
                    <td className="px-4 py-3 text-sm text-gray-900">-</td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        name="chuHo" 
                        placeholder="Mã chủ hộ" 
                        value={newRowData.chuHo} 
                        onChange={handleNewChange} 
                        className="w-full px-2 py-1 border rounded" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        name="soNha" 
                        placeholder="Số nhà" 
                        value={newRowData.soNha} 
                        onChange={handleNewChange} 
                        className="w-full px-2 py-1 border rounded" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        name="ngayLap" 
                        placeholder="DD/MM/YYYY" 
                        value={newRowData.ngayLap} 
                        onChange={handleNewChange} 
                        className="w-full px-2 py-1 border rounded" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        name="ngayCapNhat" 
                        placeholder="DD/MM/YYYY" 
                        value={newRowData.ngayCapNhat || ''} 
                        onChange={handleNewChange} 
                        className="w-full px-2 py-1 border rounded" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        name="dienTich" 
                        placeholder="Diện tích" 
                        value={newRowData.dienTich} 
                        onChange={handleNewChange} 
                        className="w-full px-2 py-1 border rounded" 
                      />
                    </td>
                    {/* <td className="px-4 py-3">
                      <select
                        name="loaiThayDoi"
                        value={newRowData.loaiThayDoi}
                        onChange={handleNewChange}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value={1}>Tạo mới</option>
                        <option value={2}>Cập nhật</option>
                      </select>
                    </td> */}
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                          onClick={handleSaveNewRow}
                          title="Lưu"
                        >
                          <FaSave />
                        </button>
                        <button 
                          className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                          onClick={handleCancelNewRow}
                          title="Hủy"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Hiển thị</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">mục</span>
            </div>
            <div className="text-sm text-gray-700">
              Tổng cộng: {data.length} hộ khẩu
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default QLHoKhau;