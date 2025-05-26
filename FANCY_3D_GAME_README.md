# 🎮 Fancy 3D Decoration Game cho Shopify với Three.js

Một game trang trí 3D tương tác được xây dựng bằng **Three.js**, **Shopify Liquid**, HTML, CSS và JavaScript. Game cho phép khách hàng trang trí một căn phòng 3D với các **mô hình 3D thực tế** thay vì chỉ là emoji.

## ✨ Tính năng chính

### 🎨 Game Core với Three.js
- **Không gian 3D thực tế**: Phòng 3D với sàn, tường được render bằng WebGL
- **Mô hình 3D thực tế**: Các vật phẩm được tạo bằng Three.js geometry thay vì emoji
- **4 danh mục vật phẩm**: Nội thất, Cây cối, Ánh sáng, Trang trí
- **32+ vật phẩm 3D**: Mỗi vật phẩm có mô hình 3D chi tiết và điểm số riêng
- **Drag & Drop 3D**: Kéo thả vật phẩm trong không gian 3D
- **Camera Controls**: Xoay, zoom, pan camera để xem phòng từ mọi góc độ
- **Raycasting**: Nhấp chính xác vào sàn để đặt vật phẩm
- **Responsive**: Hoạt động tốt trên mọi thiết bị

### 🏆 Hệ thống điểm
- Mỗi vật phẩm có điểm khác nhau (6-30 điểm)
- Theo dõi điểm tổng và số lượng vật phẩm
- Giới hạn tối đa 25 vật phẩm mỗi phòng

### 💾 Lưu trữ & Thống kê
- Lưu thiết kế với vị trí 3D chính xác
- Bảng xếp hạng với top điểm cao
- Thống kê tổng quan (lượt chơi, điểm cao nhất)
- Xuất dữ liệu JSON với tọa độ 3D

### 🎵 Hiệu ứng 3D
- **Bóng đổ thực tế**: Shadow mapping với Three.js
- **Ánh sáng động**: Ambient, directional và point lights
- **Vật liệu PBR**: Physically Based Rendering materials
- **Âm thanh**: Web Audio API cho hiệu ứng âm thanh
- **Animation**: Smooth transitions và hover effects

## 📁 Cấu trúc file

```
sections/
├── fancy-3d-decoration-game.liquid    # Section chính với Three.js viewport

assets/
├── fancy-3d-decoration-game.css       # Styles tối ưu cho Three.js
└── fancy-3d-decoration-game.js        # Three.js game logic

templates/
└── page.fancy-3d-game.liquid          # Template demo page

snippets/
└── game-leaderboard.liquid            # Bảng xếp hạng với 3D data
```

## 🚀 Cách cài đặt

### Bước 1: Upload files
1. Copy tất cả files vào thư mục tương ứng trong Shopify theme
2. Đảm bảo đường dẫn file chính xác

### Bước 2: Tạo page demo
1. Trong Shopify Admin, tạo page mới
2. Chọn template `page.fancy-3d-game`
3. Publish page

### Bước 3: Thêm vào theme
Có thể thêm section vào bất kỳ template nào:
```liquid
{% section 'fancy-3d-decoration-game' %}
```

## 🎮 Hướng dẫn chơi

### Cách chơi cơ bản
1. **Chọn danh mục**: Nhấp vào các nút danh mục (Nội thất, Cây cối, v.v.)
2. **Chọn vật phẩm**: Nhấp vào vật phẩm muốn đặt
3. **Đặt vật phẩm**: Nhấp vào sàn phòng để đặt vật phẩm 3D
4. **Di chuyển**: Kéo thả vật phẩm trong không gian 3D
5. **Xem phòng**: Kéo chuột để xoay camera, scroll để zoom

### Tính năng nâng cao Three.js
- **Camera Controls**: 
  - Kéo chuột trái: Xoay camera
  - Scroll: Zoom in/out
  - Kéo chuột phải: Pan camera
- **Raycasting**: Nhấp chính xác vào sàn để đặt vật phẩm
- **3D Drag**: Kéo thả vật phẩm với collision detection
- **Lighting**: Đèn trong game tạo ánh sáng thực tế
- **Shadows**: Bóng đổ động theo ánh sáng

## ⚙️ Tùy chỉnh

### Schema Settings mới
Section có các setting mới cho Three.js:

```json
{
  "enable_shadows": "Bật bóng đổ 3D",
  "graphics_quality": "Chất lượng đồ họa (1-3)",
  "room_color": "Màu phòng",
  "accent_color": "Màu nhấn"
}
```

### Thêm mô hình 3D mới
Trong file `fancy-3d-decoration-game.js`, thêm method tạo mô hình:

```javascript
createNewItem() {
  const group = new window.THREE.Group();
  
  // Tạo geometry
  const geometry = new window.THREE.BoxGeometry(1, 1, 1);
  const material = new window.THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    roughness: 0.7,
    metalness: 0.1
  });
  
  const mesh = new window.THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  
  return group;
}
```

### Tùy chỉnh ánh sáng
```javascript
setupCustomLights() {
  // Point light cho đèn
  const pointLight = new window.THREE.PointLight(0xffffff, 1, 10);
  pointLight.position.set(0, 5, 0);
  pointLight.castShadow = true;
  this.scene.add(pointLight);
}
```

## 📱 Responsive Design

Game được thiết kế responsive với Three.js:

- **Desktop**: Đầy đủ tính năng với mouse controls
- **Tablet**: Touch controls tối ưu cho Three.js
- **Mobile**: UI đơn giản hóa, touch-friendly camera controls

## 🔧 Troubleshooting

### Three.js không load
- Kiểm tra kết nối internet (CDN esm.sh)
- Kiểm tra console browser có lỗi không
- Thử refresh page

### WebGL không hỗ trợ
- Cập nhật browser lên phiên bản mới
- Bật hardware acceleration
- Kiểm tra WebGL support: https://get.webgl.org/

### Performance thấp
- Giảm graphics_quality trong settings
- Tắt shadows nếu cần
- Giảm số lượng vật phẩm

### Mô hình 3D không hiển thị
- Kiểm tra Three.js đã load chưa
- Kiểm tra console có lỗi geometry không
- Thử tạo lại vật phẩm

## 🎯 Ứng dụng thực tế

### E-commerce Integration với 3D
- Liên kết mô hình 3D với sản phẩm thật
- AR preview với Three.js WebXR
- 3D product configurator
- Virtual showroom

### Marketing với 3D
- Contest trang trí 3D đẹp nhất
- Social sharing với screenshot 3D
- Email marketing với 3D previews
- Interactive 3D advertisements

### Analytics 3D
- Track 3D interaction time
- Popular 3D items analytics
- 3D conversion tracking
- Heatmap 3D interactions

## 🔮 Tính năng tương lai

- [ ] **WebXR/AR support**: Xem phòng trong AR
- [ ] **GLTF model loading**: Import mô hình 3D phức tạp
- [ ] **Physics engine**: Collision detection thực tế
- [ ] **Multiplayer 3D**: Trang trí cùng nhau
- [ ] **VR support**: Trang trí trong VR
- [ ] **AI suggestions**: AI gợi ý trang trí 3D
- [ ] **Real-time lighting**: Dynamic lighting system
- [ ] **Texture customization**: Thay đổi texture vật liệu

## 🛠️ Technical Requirements

### Browser Support
- **Chrome 80+**: Full WebGL 2.0 support
- **Firefox 75+**: Good Three.js compatibility  
- **Safari 14+**: WebGL support
- **Edge 80+**: Chromium-based, full support

### Performance Requirements
- **GPU**: Dedicated graphics recommended
- **RAM**: 4GB+ for smooth experience
- **CPU**: Modern multi-core processor

### CDN Dependencies
- Three.js: `https://esm.sh/three@0.160.0`
- OrbitControls: Auto-loaded with Three.js
- DragControls: Auto-loaded with Three.js

## 📞 Hỗ trợ

Nếu gặp vấn đề với Three.js hoặc cần tùy chỉnh thêm:

- **Email**: larisa.trucmt@gmail.com
- **Three.js Docs**: https://threejs.org/docs/
- **WebGL Support**: https://get.webgl.org/
- **Performance Tips**: Xem troubleshooting guide

## 📄 License

Game này được phát triển cho Shopify theme với Three.js và có thể sử dụng tự do trong các dự án thương mại.

---

**Chúc bạn chơi game 3D vui vẻ! 🎮✨** 