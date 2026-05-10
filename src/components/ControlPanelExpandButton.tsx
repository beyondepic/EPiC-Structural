import React from 'react';

/**
 * 在控制面板折叠时显示的浮动展开按钮。
 * 使用 TailwindCSS 工具类实现半透明、悬停高亮效果。
 */
const ControlPanelExpandButton = ({ onClick, isSidebarVisible }) => {
	if (isSidebarVisible) {
		return null;
	}

	return (
		<button
			type="button"
			onClick={onClick}
			aria-label="Expand the panel"
			title="Expand the panel"
			style={{
				position: 'fixed',
				left: '0px',
				top: '72px',
				zIndex: 9999,
				width: '20px',
				height: '32px',
				backgroundColor: 'rgba(128, 128, 128, 0.4)',
				border: 'none',
				borderRadius: '4px',
				color: 'rgba(64, 64, 64, 0.8)',
				cursor: 'pointer',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
				transition: 'all 0.2s ease'
			}}
			onMouseEnter={(e) => {
				e.target.style.backgroundColor = 'rgba(128, 128, 128, 0.6)';
				e.target.style.transform = 'scale(1.05)';
			}}
			onMouseLeave={(e) => {
				e.target.style.backgroundColor = 'rgba(128, 128, 128, 0.4)';
				e.target.style.transform = 'scale(1)';
			}}
		>
			<span style={{
				fontSize: '16px',
				fontWeight: 'bold',
				lineHeight: '1'
			}}>
				›
			</span>
		</button>
	);
};

export default ControlPanelExpandButton;
