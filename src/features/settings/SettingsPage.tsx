import { useRef } from 'react';
import { useFamily } from '@/context/FamilyContext';
import { exportFamilyJson, parseFamilyImportJson } from '@/core/storage/exportImport';
import { initialFamilyState } from '@/core/family/familyManager';

export function SettingsPage() {
  const { state, setState } = useFamily();
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportFamilyJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `link-help-family-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const next = parseFamilyImportJson(text);
      setState(next);
      alert('가족 데이터를 불러왔습니다.');
    } catch {
      alert('파일 형식이 올바르지 않습니다.');
    }
  };

  const reset = () => {
    if (window.confirm('로컬에 저장된 가족 데이터를 초기화할까요?')) {
      setState(initialFamilyState());
    }
  };

  return (
    <div>
      <h1 className="page-title">설정</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        데이터는 브라우저에만 저장됩니다. 백업은 JSON보내기를 사용하세요.
      </p>

      <div className="stack">
        <button type="button" className="btn" style={{ width: '100%' }} onClick={download}>
          가족 정보보내기 (JSON)
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ width: '100%' }}
          onClick={() => fileRef.current?.click()}
        >
          가족 정보 불러오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onFile}
        />
        <button type="button" className="btn secondary" style={{ width: '100%' }} onClick={reset}>
          데이터 초기화
        </button>
      </div>

      <p className="muted" style={{ marginTop: 24, fontSize: '0.85rem' }}>
        복지 DB는 <code>public/welfare-db</code>의 JSON입니다. GitHub 저장소와 함께 배포·갱신할 수
        있습니다.
      </p>
    </div>
  );
}
