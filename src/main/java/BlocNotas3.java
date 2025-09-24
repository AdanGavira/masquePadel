import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;
import java.awt.event.*;

public class BlocNotas3 extends JFrame {

    private JProgressBar progressBar;

    // Panel personalizado para fondo
    class FondoPanel extends JPanel {
        private Image imagen;

        public FondoPanel(String rutaImagen) {
            this.imagen = new ImageIcon(rutaImagen).getImage();
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            g.drawImage(imagen, 0, 0, getWidth(), getHeight(), this);
        }
    }

    public BlocNotas3() {
        // Colores
        Color azulOscuro = new Color(0x00, 0x2D, 0x72);
        Color amarilloFuerte = new Color(0xFB, 0xC0, 0x2D);

        setTitle("MASQUEPADEL - Versión Creativa");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(700, 600);
        setLocationRelativeTo(null);

        FondoPanel panelFondo = new FondoPanel("img/padel-fondo.jpg");
        panelFondo.setLayout(new GridBagLayout());
        panelFondo.setBackground(amarilloFuerte);

        JPanel panelTarjeta = new JPanel(new BorderLayout());
        panelTarjeta.setPreferredSize(new Dimension(600, 500));
        panelTarjeta.setBackground(Color.WHITE);
        panelTarjeta.setBorder(new CompoundBorder(
                new LineBorder(azulOscuro, 3, true),
                new EmptyBorder(15, 15, 15, 15)
        ));

        // Logo + título
        JPanel panelLogo = new JPanel(new FlowLayout(FlowLayout.CENTER, 15, 0));
        panelLogo.setBackground(Color.WHITE);
        ImageIcon iconoOriginal = new ImageIcon("img/logo-masquepadel-final.png");
        Image img = iconoOriginal.getImage().getScaledInstance(90, 90, Image.SCALE_SMOOTH);
        JLabel lblImagen = new JLabel(new ImageIcon(img));
        JLabel lblTexto = new JLabel("Versión 3 (Creativa)");
        lblTexto.setFont(new Font("SansSerif", Font.BOLD, 22));
        lblTexto.setForeground(azulOscuro);
        panelLogo.add(lblImagen);
        panelLogo.add(lblTexto);
        panelTarjeta.add(panelLogo, BorderLayout.NORTH);

        JTabbedPane tabbedPane = new JTabbedPane();

        // ---------------- Login ----------------
        JPanel panelLogin = new JPanel(new GridBagLayout());
        panelLogin.setBackground(amarilloFuerte);
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        gbc.gridx = 0; gbc.gridy = 0;
        JLabel lblUsuario = new JLabel("Usuario:");
        lblUsuario.setForeground(Color.WHITE);
        lblUsuario.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelLogin.add(lblUsuario, gbc);

        gbc.gridx = 1;
        JTextField txtUsuario = new JTextField(15);
        panelLogin.add(txtUsuario, gbc);

        gbc.gridx = 0; gbc.gridy = 1;
        JLabel lblPassword = new JLabel("Contraseña:");
        lblPassword.setForeground(Color.WHITE);
        lblPassword.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelLogin.add(lblPassword, gbc);

        gbc.gridx = 1;
        JPasswordField txtPassword = new JPasswordField(15);
        panelLogin.add(txtPassword, gbc);

        gbc.gridx = 0; gbc.gridy = 2;
        JLabel lblIdioma = new JLabel("Idioma:");
        lblIdioma.setForeground(Color.WHITE);
        lblIdioma.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelLogin.add(lblIdioma, gbc);

        gbc.gridx = 1;
        JComboBox<String> comboIdioma = new JComboBox<>(new String[]{"Español", "Inglés", "Francés"});
        panelLogin.add(comboIdioma, gbc);

        gbc.gridx = 0; gbc.gridy = 3;
        JLabel lblNivelLogin = new JLabel("Nivel de pádel:");
        lblNivelLogin.setForeground(Color.WHITE);
        lblNivelLogin.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelLogin.add(lblNivelLogin, gbc);

        gbc.gridx = 1;
        JSlider sliderLogin = new JSlider(1, 10, 5);
        sliderLogin.setMajorTickSpacing(1);
        sliderLogin.setPaintTicks(true);
        sliderLogin.setPaintLabels(true);
        sliderLogin.setPreferredSize(new Dimension(300, 50));
        sliderLogin.setBackground(amarilloFuerte);
        sliderLogin.setForeground(Color.black);
        sliderLogin.setUI(new javax.swing.plaf.metal.MetalSliderUI() {
            @Override
            public void paintTrack(Graphics g) {
                g.setColor(Color.BLACK);
                g.fillRect(trackRect.x, trackRect.y + trackRect.height / 2 - 2, trackRect.width, 4);
            }

            @Override
            public void paintThumb(Graphics g) {
                g.setColor(Color.WHITE);
                g.fillOval(thumbRect.x, thumbRect.y, thumbRect.width, thumbRect.height);
            }
        });
        panelLogin.add(sliderLogin, gbc);

        gbc.gridx = 0; gbc.gridy = 4; gbc.gridwidth = 2;
        JButton btnAcceder = new JButton("Acceder");
        btnAcceder.setBackground(azulOscuro);
        btnAcceder.setForeground(Color.WHITE);
        btnAcceder.setFocusPainted(false);
        btnAcceder.setBorderPainted(false);
        btnAcceder.setOpaque(true);
        panelLogin.add(btnAcceder, gbc);

        gbc.gridy = 5;
        progressBar = new JProgressBar(0, 100);
        progressBar.setStringPainted(true);
        progressBar.setVisible(false);
        progressBar.setForeground(Color.BLACK);
        progressBar.setBackground(amarilloFuerte);
        panelLogin.add(progressBar, gbc);

        btnAcceder.addActionListener(e -> iniciarCarga());

        tabbedPane.addTab("Login", panelLogin);

        // ---------------- Registro ----------------
        JPanel panelRegistro = new JPanel(new GridBagLayout());
        panelRegistro.setBackground(amarilloFuerte);
        GridBagConstraints gbcReg = new GridBagConstraints();
        gbcReg.insets = new Insets(8, 8, 8, 8);
        gbcReg.fill = GridBagConstraints.HORIZONTAL;

        JPanel panelDatos = new JPanel(new GridBagLayout());
        panelDatos.setBackground(amarilloFuerte);
        GridBagConstraints gbcDatos = new GridBagConstraints();
        gbcDatos.insets = new Insets(8, 8, 8, 8);
        gbcDatos.fill = GridBagConstraints.HORIZONTAL;

        gbcDatos.gridx = 0; gbcDatos.gridy = 0;
        JLabel lblUsuario1 = new JLabel("Usuario:");
        lblUsuario1.setForeground(Color.WHITE);
        lblUsuario1.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelDatos.add(lblUsuario1, gbcDatos);

        gbcDatos.gridx = 1;
        JTextField txtRegUsuario = new JTextField(15);
        panelDatos.add(txtRegUsuario, gbcDatos);

        gbcDatos.gridx = 0; gbcDatos.gridy = 1;
        JLabel lblCorreo = new JLabel("Correo:");
        lblCorreo.setForeground(Color.WHITE);
        lblCorreo.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelDatos.add(lblCorreo, gbcDatos);

        gbcDatos.gridx = 1;
        JTextField txtCorreo = new JTextField(15);
        panelDatos.add(txtCorreo, gbcDatos);

        gbcDatos.gridx = 0; gbcDatos.gridy = 2;
        JLabel lblPass = new JLabel("Contraseña:");
        lblPass.setForeground(Color.WHITE);
        lblPass.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelDatos.add(lblPass, gbcDatos);

        gbcDatos.gridx = 1;
        JPasswordField txtRegPass1 = new JPasswordField(15);
        panelDatos.add(txtRegPass1, gbcDatos);

        gbcDatos.gridx = 0; gbcDatos.gridy = 3;
        JLabel lblEdad = new JLabel("Edad:");
        lblEdad.setForeground(Color.WHITE);
        lblEdad.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelDatos.add(lblEdad, gbcDatos);

        gbcDatos.gridx = 1;
        SpinnerNumberModel modeloEdad = new SpinnerNumberModel(25, 10, 100, 1);
        JSpinner spinnerEdad = new JSpinner(modeloEdad);
        ((JSpinner.DefaultEditor) spinnerEdad.getEditor()).getTextField().setColumns(5);
        panelDatos.add(spinnerEdad, gbcDatos);

        JPanel panelNivel = new JPanel(new GridBagLayout());
        panelNivel.setBackground(amarilloFuerte);
        GridBagConstraints gbcNivel = new GridBagConstraints();
        gbcNivel.insets = new Insets(8, 8, 8, 8);
        gbcNivel.fill = GridBagConstraints.HORIZONTAL;

        gbcNivel.gridy = 0;
        JLabel lblNivel = new JLabel("Nivel de pádel:");
        lblNivel.setForeground(Color.WHITE);
        lblNivel.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelNivel.add(lblNivel, gbcNivel);

        gbcNivel.gridx = 1;
        JSlider sliderNivel = new JSlider(1, 10, 5);
        sliderNivel.setMajorTickSpacing(1);
        sliderNivel.setPaintTicks(true);
        sliderNivel.setPaintLabels(true);
        sliderNivel.setPreferredSize(new Dimension(300, 50));
        sliderNivel.setBackground(amarilloFuerte);
        sliderNivel.setForeground(Color.BLACK);

        // Personalización visual
        sliderNivel.setUI(new javax.swing.plaf.metal.MetalSliderUI() {
            @Override
            public void paintTrack(Graphics g) {
                g.setColor(Color.BLACK);
                g.fillRect(trackRect.x, trackRect.y + trackRect.height / 2 - 2, trackRect.width, 4);
            }

            @Override
            public void paintThumb(Graphics g) {
                g.setColor(Color.WHITE);
                g.fillOval(thumbRect.x, thumbRect.y, thumbRect.width, thumbRect.height);
            }
        });
        panelNivel.add(sliderNivel, gbcNivel);

        // Términos y condiciones
        gbcNivel.gridx = 0; gbcNivel.gridy = 1; gbcNivel.gridwidth = 2;
        JPanel panelTerminos = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        panelTerminos.setBackground(amarilloFuerte);

        JCheckBox chkTerminos = new JCheckBox("Aceptar términos y condiciones");
        chkTerminos.setBackground(amarilloFuerte);
        chkTerminos.setForeground(Color.WHITE);
        chkTerminos.setFont(new Font("SansSerif", Font.PLAIN, 13));

        JRadioButton rbtnRecordar = new JRadioButton("Recordar usuario y contraseña");
        rbtnRecordar.setBackground(amarilloFuerte);
        rbtnRecordar.setForeground(Color.WHITE);
        rbtnRecordar.setFont(new Font("SansSerif", Font.PLAIN, 13));

        panelTerminos.add(chkTerminos);
        panelTerminos.add(rbtnRecordar);
        panelNivel.add(panelTerminos, gbcNivel);

        // Botón registrar
        gbcNivel.gridy = 2;
        JButton btnRegistrar = new JButton("Registrar");
        btnRegistrar.setBackground(azulOscuro);
        btnRegistrar.setForeground(Color.WHITE);
        btnRegistrar.setFocusPainted(false);
        btnRegistrar.setBorderPainted(false);
        btnRegistrar.setOpaque(true);

        JPanel panelBotonRegistrar = new JPanel(new FlowLayout(FlowLayout.CENTER));
        panelBotonRegistrar.setBackground(amarilloFuerte);
        panelBotonRegistrar.add(btnRegistrar);
        panelNivel.add(panelBotonRegistrar, gbcNivel);

        // Validación de términos
        btnRegistrar.addActionListener(e -> {
            if (!chkTerminos.isSelected()) {
                JOptionPane.showMessageDialog(panelNivel,
                        "Debes aceptar los términos y condiciones para continuar.",
                        "Registro incompleto",
                        JOptionPane.WARNING_MESSAGE);
                return;
            }

            JOptionPane.showMessageDialog(panelNivel,
                    "Registro completado correctamente",
                    "Registro",
                    JOptionPane.INFORMATION_MESSAGE);
        });

        // Añadir ambos paneles al panelRegistro
        gbcReg.gridx = 0; gbcReg.gridy = 0;
        panelRegistro.add(panelDatos, gbcReg);
        gbcReg.gridy = 1;
        panelRegistro.add(panelNivel, gbcReg);

        // Añadir pestaña de registro
        tabbedPane.addTab("Registro", panelRegistro);

        // Añadir pestañas al panel principal
        panelTarjeta.add(tabbedPane, BorderLayout.CENTER);
        panelFondo.add(panelTarjeta);
        setContentPane(panelFondo);
        setVisible(true);
    }

    // Método para animar la barra de progreso en el login
    private void iniciarCarga() {
        progressBar.setVisible(true);
        progressBar.setValue(0);

        Timer timer = new Timer(50, new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                int value = progressBar.getValue();
                if (value < 100) {
                    progressBar.setValue(value + 5);
                } else {
                    ((Timer) e.getSource()).stop();
                    JOptionPane.showMessageDialog(null,
                            "Acceso concedido",
                            "Login",
                            JOptionPane.INFORMATION_MESSAGE);
                    progressBar.setVisible(false);
                }
            }
        });
        timer.start();
    }

    // Método principal
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new BlocNotas3());
    }
}




















